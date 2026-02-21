import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BLOOM_PRODUCT_CONTEXT = `
BLOOM is a premium all-in-one women's wellness powder (Chocolate Flavor, 36g per pouch).

INGREDIENTS & DOSES:
- Whey Protein Isolate: 6g
- Pea Protein Isolate: 5g
- Pumpkin Seed Protein: 5g
- Creatine: 5g
- Marine Collagen Peptides: 4g
- Hyaluronic Acid: 0.15g
- Phytoceramides: 0.2g
- Biotin: 0.005g
- Vitamin E: 0.015g
- Calcium: 0.4g
- Vitamin D3: 0.01g
- Magnesium (Magnesium Malate): 0.05g
- Vitamin K2: 0.05g
- Iron: 0.009g
- Vitamin B12: 0.0125g
- Maca Root Powder: 1.5g
- Ashwagandha: 0.3g
- Omega-3 (from flaxseed): 0.5g
- GOS (Galactooligosaccharides) prebiotic: 2g
- Bromelain: 0.24g
- Papain: 0.1g
- Potassium: 0.1g
- Chocolate flavor, Stevia sweetened

KEY BENEFITS:
1. Muscle Preservation & Metabolism: 16g total protein + 5g creatine. Fights age-related muscle loss (sarcopenia), supports strength, tone, and metabolic rate. Reduces "skinny fat" effect after 40.
2. Skin Elasticity & Anti-Aging: Collagen + Hyaluronic Acid + Phytoceramides. Supports hydration, firmness, glow. Reduces fine lines. Strengthens skin barrier (critical during estrogen decline).
3. Bone Density Protection: Calcium + Vitamin D3 + K2 + Magnesium. Prevents osteoporosis, supports calcium absorption and proper bone deposition.
4. Hormone Balance & Mood Stability: Maca + Ashwagandha. Supports adrenal function, helps with mood swings, stress, irritability, and energy dips during peri/post-menopause.
5. Energy & Brain Support: B12 + Iron. Combats fatigue, supports cognitive clarity.
6. Gut Health & Bloating Reduction: GOS prebiotic + Bromelain & Papain enzymes. Reduces constipation and digestive sluggishness common in menopause.
7. Heart & Inflammation Support: Omega-3. Supports cardiovascular health (crucial post-menopause).

UNIQUE DIFFERENTIATORS:
- Only product combining: protein + creatine + collagen + adaptogens + gut enzymes + bone support in one sachet
- NOT just a protein powder — it's a Menopause Metabolism + Beauty + Strength System
- Core hook: "After 40, protein alone is not enough."
- Rare inclusion of creatine in women's beauty/wellness formulas
- Ceramides + Collagen combo for skin barrier
- Adaptogens + Gut + Bone in one convenient daily sachet

TARGET MARKET:
- Primary (Age 35–45): Perimenopause women noticing stubborn weight gain, lower muscle tone, skin dryness, mood swings, lower energy. Busy lifestyle (career + family). Wants a complete solution.
- Secondary (Age 45–60): Post-menopause women concerned about bone loss, muscle weakness, fatigue, belly fat, dry skin, low libido. More health-focused, willing to invest in premium solutions.

MESSAGING ANGLES:
- Perimenopause: "Stay strong, toned and glowing after 35." "Protect your future body now." Prevention + beauty + strength.
- Post-menopause: "Strong bones. Firm skin. Lean muscle." "Reverse the visible signs of aging." "Daily anti-aging ritual."
`;

interface GeneratePostRequest {
  environment: string;
  audience: string;
  benefitFocus: string;
  tone: string;
  postLength: string;
  includeHashtags: boolean;
  includeEmojis: boolean;
  includeCta: boolean;
  ctaType: string;
  customNote: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: GeneratePostRequest = await req.json();
    const {
      environment,
      audience,
      benefitFocus,
      tone,
      postLength,
      includeHashtags,
      includeEmojis,
      includeCta,
      ctaType,
      customNote,
    } = body;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const wordCountMap: Record<string, string> = {
      short: '80–120 words',
      medium: '180–250 words',
      long: '320–400 words',
    };
    const wordCount = wordCountMap[postLength] || '180–250 words';

    const hashtagGuidance = includeHashtags
      ? 'Include 5–8 highly relevant hashtags at the end of the post (e.g. #BloomPowder #WomenOver40 #MenopauseHealth #StrongWomen #CollagenBoost #BoneHealth #WomensWellness #HealthyAging).'
      : 'Do NOT include any hashtags.';

    const emojiGuidance = includeEmojis
      ? 'Use emojis naturally and strategically throughout the post to add visual appeal and emotion. Keep them purposeful, not excessive.'
      : 'Do NOT use any emojis.';

    const ctaGuidance = includeCta
      ? `End with a clear call-to-action: ${ctaType}.`
      : 'Do not add a call-to-action at the end.';

    const audienceDescription =
      audience === 'perimenopause'
        ? 'women aged 35–45 experiencing perimenopause (noticing weight gain, muscle loss, skin changes, mood swings)'
        : audience === 'postmenopause'
        ? 'women aged 45–60 in post-menopause (concerned about bone density, muscle weakness, fatigue, belly fat, dry skin)'
        : 'women aged 35–60 in both perimenopause and post-menopause stages';

    const systemPrompt = `You are an expert Facebook copywriter specializing in women's health and wellness marketing. You write emotionally resonant, science-backed social media content that speaks directly to women's real experiences and concerns.

${BLOOM_PRODUCT_CONTEXT}

Your writing style is:
- Empathetic and understanding — you know what these women are going through
- Credible but accessible — you back claims with ingredients/science without being clinical
- Direct and action-oriented — every word earns its place
- Authentic — you avoid overused marketing clichés and speak like a knowledgeable friend

Always write for Facebook specifically: optimized for engagement, designed to stop the scroll, and crafted to generate comments, shares, and clicks.`;

    const userPrompt = `Create a Facebook post for BLOOM powder with these specifications:

POST ENVIRONMENT/FORMAT: ${environment}
TARGET AUDIENCE: ${audienceDescription}
BENEFIT FOCUS: ${benefitFocus === 'all' ? 'All key benefits (give a balanced overview)' : benefitFocus}
TONE: ${tone}
LENGTH: Approximately ${wordCount}
EMOJIS: ${emojiGuidance}
HASHTAGS: ${hashtagGuidance}
CALL-TO-ACTION: ${ctaGuidance}
${customNote ? `ADDITIONAL NOTES: ${customNote}` : ''}

Write ONLY the Facebook post content. No explanations, no meta-commentary, no "Here is your post:" preamble. Just the ready-to-publish post.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.82,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const aiData = await response.json();
    const generatedPost = aiData.choices?.[0]?.message?.content;

    if (!generatedPost) {
      throw new Error('No content returned from AI');
    }

    return new Response(
      JSON.stringify({ post: generatedPost }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error generating Bloom post:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
