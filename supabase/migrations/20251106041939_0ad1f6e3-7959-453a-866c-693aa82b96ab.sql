-- Insert dummy courses
INSERT INTO public.courses (id, title, description, category, difficulty_level, estimated_hours, prerequisites, learning_outcomes, thumbnail_url, is_published, display_order) VALUES
(
  '550e8400-e29b-41d4-a716-446655440001',
  'Introduction to Traditional Thai Medicine',
  'Discover the foundational principles of Traditional Thai Medicine, including the four elements theory, energy lines (Sen), and holistic approaches to health and wellness. Perfect for beginners looking to understand TTM philosophy.',
  'Fundamentals',
  'beginner',
  8,
  '[]'::jsonb,
  '["Understand the fundamental principles of Traditional Thai Medicine", "Identify the four elements and their role in health", "Learn about energy lines (Sen) and their significance", "Apply basic diagnostic observation techniques", "Recognize the holistic approach to patient care"]'::jsonb,
  'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=400&fit=crop',
  true,
  1
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Advanced Herbal Formulations',
  'Master the art of creating complex herbal formulations for various conditions. Learn about herb interactions, dosage calculations, and customization techniques for individual patient needs.',
  'Clinical Practice',
  'advanced',
  12,
  '["Completion of Introduction to TTM course", "Basic understanding of herb properties", "Clinical observation experience (recommended)"]'::jsonb,
  '["Create complex multi-herb formulations", "Calculate precise dosages for different patient types", "Understand herb-herb interactions and contraindications", "Customize formulations for individual constitutions", "Document and track treatment outcomes"]'::jsonb,
  'https://images.unsplash.com/photo-1512069545556-5482238acfc8?w=800&h=400&fit=crop',
  true,
  2
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  'Patient Assessment Techniques',
  'Develop comprehensive patient assessment skills including pulse reading, tongue diagnosis, abdominal palpation, and constitutional analysis. Learn to integrate multiple assessment methods for accurate diagnosis.',
  'Clinical Skills',
  'intermediate',
  10,
  '["Basic understanding of anatomy and physiology", "Familiarity with TTM principles"]'::jsonb,
  '["Perform accurate pulse diagnosis", "Conduct thorough tongue examination", "Execute proper abdominal palpation techniques", "Assess patient constitution and imbalances", "Integrate multiple diagnostic findings", "Create comprehensive assessment reports"]'::jsonb,
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=400&fit=crop',
  true,
  3
),
(
  '550e8400-e29b-41d4-a716-446655440004',
  'Business Management for Practitioners',
  'Learn essential business skills for running a successful Traditional Thai Medicine practice. Topics include patient management, scheduling, billing, marketing, and legal compliance.',
  'Professional Development',
  'intermediate',
  6,
  '[]'::jsonb,
  '["Set up efficient practice management systems", "Implement effective patient scheduling", "Handle billing and insurance processes", "Develop marketing strategies for your practice", "Understand legal and regulatory requirements", "Build patient retention strategies"]'::jsonb,
  'https://images.unsplash.com/photo-1554224311-beee460c201f?w=800&h=400&fit=crop',
  false,
  4
);

-- Insert lessons for Course 1: Introduction to TTM (5 lessons)
INSERT INTO public.course_lessons (id, course_id, title, description, lesson_type, content_url, video_duration_seconds, display_order, is_published) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Welcome and Overview', 'Introduction to the course structure, learning objectives, and what you can expect to achieve. Meet your instructor and understand the learning journey ahead.', 'video', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 360, 1, true),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'The Four Elements Theory', 'Deep dive into the four elements (Earth, Water, Wind, Fire) and their manifestations in the body. Learn how imbalances lead to disease and health.', 'video', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 1200, 2, true),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Energy Lines (Sen) Fundamentals', 'Explore the concept of Sen lines, the pathways of vital energy in Thai medicine. Learn the 10 main Sen lines and their therapeutic significance.', 'video', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 1560, 3, true),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Holistic Assessment Principles', 'Understanding the holistic approach to patient care in TTM. Learn to observe, question, and assess patients comprehensively.', 'video', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 1440, 4, true),
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'Integration and Practice', 'Putting it all together: case studies and practical application of TTM principles. Review key concepts and prepare for advanced study.', 'video', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 1800, 5, true);

-- Insert lessons for Course 2: Advanced Herbal Formulations (8 lessons)
INSERT INTO public.course_lessons (id, course_id, title, description, lesson_type, content_url, video_duration_seconds, display_order, is_published) VALUES
('650e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002', 'Course Introduction and Advanced Concepts', 'Overview of advanced formulation principles and what makes a master herbalist.', 'video', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 480, 1, true),
('650e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440002', 'Herb Classification and Properties', 'Advanced classification systems, thermal properties, and taste profiles of medicinal herbs.', 'video', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 1680, 2, true),
('650e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', 'Synergistic Herb Combinations', 'Understanding how herbs work together to enhance therapeutic effects and minimize side effects.', 'video', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 1920, 3, true),
('650e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', 'Dosage Calculation Methods', 'Master precise dosage calculations based on body weight, constitution, and condition severity.', 'video', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 1560, 4, true),
('650e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002', 'Herb Interactions and Contraindications', 'Critical safety information about herb-herb and herb-drug interactions.', 'video', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 1440, 5, true),
('650e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440002', 'Constitutional Customization', 'Tailoring formulations to individual patient constitutions and patterns.', 'video', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 1800, 6, true),
('650e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440002', 'Complex Case Studies', 'Real-world case studies of complex conditions requiring sophisticated formulations.', 'video', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 2100, 7, true),
('650e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440002', 'Documentation and Follow-up', 'Best practices for documenting formulations and tracking patient outcomes.', 'video', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 1200, 8, true);

-- Insert lessons for Course 3: Patient Assessment (6 lessons)
INSERT INTO public.course_lessons (id, course_id, title, description, lesson_type, content_url, video_duration_seconds, display_order, is_published) VALUES
('650e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440003', 'Assessment Fundamentals', 'Overview of comprehensive patient assessment in Traditional Thai Medicine.', 'video', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 540, 1, true),
('650e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440003', 'Pulse Diagnosis Techniques', 'Learn to read and interpret pulse qualities, depths, and rhythms for diagnostic insights.', 'video', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 1920, 2, true),
('650e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440003', 'Tongue Examination Methods', 'Comprehensive tongue diagnosis including color, coating, shape, and moisture assessment.', 'video', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 1680, 3, true),
('650e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440003', 'Abdominal Palpation', 'Techniques for assessing abdominal organs, tension patterns, and energy blockages through palpation.', 'video', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 1560, 4, true),
('650e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440003', 'Constitutional Analysis', 'Determining patient constitution types and their implications for treatment planning.', 'video', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 1440, 5, true),
('650e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440003', 'Integrated Assessment Reports', 'Synthesizing multiple assessment findings into comprehensive, actionable reports.', 'video', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 1800, 6, true);

-- Insert some lesson resources
INSERT INTO public.lesson_resources (id, lesson_id, resource_name, resource_type, description, display_order) VALUES
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002', 'Four Elements Reference Chart', 'pdf', 'Quick reference guide to the four elements and their characteristics', 1),
('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 'Element Assessment Worksheet', 'pdf', 'Practice worksheet for identifying elemental imbalances', 2),
('750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', 'Sen Lines Diagram', 'pdf', 'Illustrated map of the 10 main Sen energy lines', 1),
('750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440005', 'Case Study Templates', 'pdf', 'Templates for documenting patient assessments and treatment plans', 1),
('750e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440014', 'Dosage Calculation Tables', 'pdf', 'Comprehensive tables for calculating herb dosages by weight and constitution', 1),
('750e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440015', 'Herb Interaction Matrix', 'pdf', 'Complete matrix of known herb interactions and contraindications', 1),
('750e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440022', 'Pulse Reading Practice Guide', 'pdf', 'Step-by-step guide with practice exercises for pulse diagnosis', 1),
('750e8400-e29b-41d4-a716-446655440008', '650e8400-e29b-41d4-a716-446655440023', 'Tongue Diagnosis Atlas', 'pdf', 'Visual atlas of tongue presentations and their meanings', 1);