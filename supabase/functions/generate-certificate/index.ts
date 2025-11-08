import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CertificateRequest {
  enrollmentId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { enrollmentId }: CertificateRequest = await req.json();

    if (!enrollmentId) {
      throw new Error('Enrollment ID is required');
    }

    console.log('Generating certificate for enrollment:', enrollmentId);

    // Fetch enrollment details with course and user info
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select(`
        id,
        completed_at,
        user_id,
        course_id,
        courses!inner (
          id,
          title,
          instructor_id
        )
      `)
      .eq('id', enrollmentId)
      .single();

    if (enrollmentError || !enrollment) {
      throw new Error('Enrollment not found');
    }

    if (!enrollment.completed_at) {
      throw new Error('Course not completed');
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', enrollment.user_id)
      .single();

    // Check if certificate already exists
    const { data: existingCert } = await supabase
      .from('course_certificates')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .single();

    const verificationCode = existingCert?.verification_code || 
      Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    // Generate PDF content as SVG
    const completionDate = new Date(enrollment.completed_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const svgCertificate = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="600" fill="#ffffff"/>
        <rect x="20" y="20" width="760" height="560" fill="none" stroke="#0EA5E9" stroke-width="4"/>
        <rect x="30" y="30" width="740" height="540" fill="none" stroke="#0EA5E9" stroke-width="2"/>
        
        <text x="400" y="100" font-family="serif" font-size="48" font-weight="bold" fill="#1e293b" text-anchor="middle">
          Certificate of Completion
        </text>
        
        <text x="400" y="160" font-family="sans-serif" font-size="20" fill="#64748b" text-anchor="middle">
          This certifies that
        </text>
        
        <text x="400" y="220" font-family="serif" font-size="36" font-weight="bold" fill="#0EA5E9" text-anchor="middle">
          ${profile?.full_name || 'Practitioner'}
        </text>
        
        <text x="400" y="280" font-family="sans-serif" font-size="20" fill="#64748b" text-anchor="middle">
          has successfully completed
        </text>
        
        <text x="400" y="340" font-family="serif" font-size="28" font-weight="bold" fill="#1e293b" text-anchor="middle">
          ${(enrollment.courses as any)?.title || 'Course'}
        </text>
        
        <text x="400" y="400" font-family="sans-serif" font-size="18" fill="#64748b" text-anchor="middle">
          Completion Date: ${completionDate}
        </text>
        
        <text x="400" y="480" font-family="monospace" font-size="14" fill="#94a3b8" text-anchor="middle">
          Verification Code: ${verificationCode}
        </text>
        
        <line x1="150" y1="520" x2="350" y2="520" stroke="#0EA5E9" stroke-width="2"/>
        <text x="250" y="545" font-family="sans-serif" font-size="14" fill="#64748b" text-anchor="middle">
          Authorized Signature
        </text>
      </svg>
    `;

    // Convert SVG to PNG using a simple approach (base64 encode)
    const encoder = new TextEncoder();
    const svgData = encoder.encode(svgCertificate);
    const base64Svg = btoa(String.fromCharCode(...svgData));
    
    // For a real implementation, you'd convert to PDF here
    // For now, we'll store the SVG as a file
    const fileName = `${enrollmentId}-${verificationCode}.svg`;
    
    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(fileName, svgData, {
        contentType: 'image/svg+xml',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL (signed URL for private bucket)
    const { data: urlData } = await supabase.storage
      .from('certificates')
      .createSignedUrl(fileName, 31536000); // 1 year expiry

    const certificateUrl = urlData?.signedUrl || '';

    // Update or create certificate record
    if (existingCert) {
      await supabase
        .from('course_certificates')
        .update({ certificate_url: certificateUrl })
        .eq('id', existingCert.id);
    } else {
      await supabase
        .from('course_certificates')
        .insert({
          enrollment_id: enrollmentId,
          user_id: enrollment.user_id,
          course_id: enrollment.course_id,
          certificate_url: certificateUrl,
          verification_code: verificationCode
        });
    }

    console.log('Certificate generated successfully:', fileName);

    return new Response(
      JSON.stringify({
        success: true,
        certificateUrl,
        verificationCode
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error generating certificate:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
