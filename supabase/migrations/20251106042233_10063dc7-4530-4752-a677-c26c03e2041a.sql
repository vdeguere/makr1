-- Add quizzes for Course 1 lessons
INSERT INTO public.lesson_quizzes (id, lesson_id, title, description, passing_score, max_attempts, time_limit_minutes) VALUES
-- Quiz for Lesson 2: Four Elements Theory
(
  '950e8400-e29b-41d4-a716-446655440001',
  '650e8400-e29b-41d4-a716-446655440002',
  'Four Elements Theory Quiz',
  'Test your understanding of the four elements in Traditional Thai Medicine',
  70,
  3,
  15
),
-- Quiz for Lesson 3: Energy Lines (Sen)
(
  '950e8400-e29b-41d4-a716-446655440002',
  '650e8400-e29b-41d4-a716-446655440003',
  'Sen Lines Assessment',
  'Verify your knowledge of energy lines and their therapeutic applications',
  75,
  3,
  20
);

-- Questions for Quiz 1: Four Elements Theory
INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_type, explanation, display_order) VALUES
(
  'a50e8400-e29b-41d4-a716-446655440001',
  '950e8400-e29b-41d4-a716-446655440001',
  'Which element is associated with the skeletal system and provides structure to the body?',
  'multiple_choice',
  'The Earth element represents solid structures in the body including bones, muscles, and tissues. It provides stability and form.',
  1
),
(
  'a50e8400-e29b-41d4-a716-446655440002',
  '950e8400-e29b-41d4-a716-446655440001',
  'What does an excess of the Fire element typically manifest as in the body?',
  'multiple_choice',
  'Excess Fire element creates heat conditions such as inflammation, fever, and irritability. It represents metabolic processes and transformation.',
  2
),
(
  'a50e8400-e29b-41d4-a716-446655440003',
  '950e8400-e29b-41d4-a716-446655440001',
  'The Water element in TTM is primarily responsible for which bodily function?',
  'multiple_choice',
  'Water element governs all fluids in the body including blood, lymph, digestive fluids, and other secretions. It represents cohesion and fluidity.',
  3
),
(
  'a50e8400-e29b-41d4-a716-446655440004',
  '950e8400-e29b-41d4-a716-446655440001',
  'Which element is associated with movement and respiration?',
  'multiple_choice',
  'Wind element represents all movement in the body, including breathing, circulation, and nerve impulses. It is the most dynamic of the four elements.',
  4
),
(
  'a50e8400-e29b-41d4-a716-446655440005',
  '950e8400-e29b-41d4-a716-446655440001',
  'In TTM philosophy, health is achieved when:',
  'multiple_choice',
  'Perfect health in TTM occurs when all four elements are in harmonious balance. Disease arises from elemental imbalances.',
  5
);

-- Answers for Question 1
INSERT INTO public.quiz_answers (id, question_id, answer_text, is_correct, display_order) VALUES
('b50e8400-e29b-41d4-a716-446655440001', 'a50e8400-e29b-41d4-a716-446655440001', 'Earth', true, 1),
('b50e8400-e29b-41d4-a716-446655440002', 'a50e8400-e29b-41d4-a716-446655440001', 'Water', false, 2),
('b50e8400-e29b-41d4-a716-446655440003', 'a50e8400-e29b-41d4-a716-446655440001', 'Fire', false, 3),
('b50e8400-e29b-41d4-a716-446655440004', 'a50e8400-e29b-41d4-a716-446655440001', 'Wind', false, 4);

-- Answers for Question 2
INSERT INTO public.quiz_answers (id, question_id, answer_text, is_correct, display_order) VALUES
('b50e8400-e29b-41d4-a716-446655440011', 'a50e8400-e29b-41d4-a716-446655440002', 'Cold and stiffness', false, 1),
('b50e8400-e29b-41d4-a716-446655440012', 'a50e8400-e29b-41d4-a716-446655440002', 'Inflammation and fever', true, 2),
('b50e8400-e29b-41d4-a716-446655440013', 'a50e8400-e29b-41d4-a716-446655440002', 'Fluid retention', false, 3),
('b50e8400-e29b-41d4-a716-446655440014', 'a50e8400-e29b-41d4-a716-446655440002', 'Weakness', false, 4);

-- Answers for Question 3
INSERT INTO public.quiz_answers (id, question_id, answer_text, is_correct, display_order) VALUES
('b50e8400-e29b-41d4-a716-446655440021', 'a50e8400-e29b-41d4-a716-446655440003', 'Movement and circulation', false, 1),
('b50e8400-e29b-41d4-a716-446655440022', 'a50e8400-e29b-41d4-a716-446655440003', 'All bodily fluids', true, 2),
('b50e8400-e29b-41d4-a716-446655440023', 'a50e8400-e29b-41d4-a716-446655440003', 'Heat generation', false, 3),
('b50e8400-e29b-41d4-a716-446655440024', 'a50e8400-e29b-41d4-a716-446655440003', 'Structural support', false, 4);

-- Answers for Question 4
INSERT INTO public.quiz_answers (id, question_id, answer_text, is_correct, display_order) VALUES
('b50e8400-e29b-41d4-a716-446655440031', 'a50e8400-e29b-41d4-a716-446655440004', 'Earth', false, 1),
('b50e8400-e29b-41d4-a716-446655440032', 'a50e8400-e29b-41d4-a716-446655440004', 'Water', false, 2),
('b50e8400-e29b-41d4-a716-446655440033', 'a50e8400-e29b-41d4-a716-446655440004', 'Fire', false, 3),
('b50e8400-e29b-41d4-a716-446655440034', 'a50e8400-e29b-41d4-a716-446655440004', 'Wind', true, 4);

-- Answers for Question 5
INSERT INTO public.quiz_answers (id, question_id, answer_text, is_correct, display_order) VALUES
('b50e8400-e29b-41d4-a716-446655440041', 'a50e8400-e29b-41d4-a716-446655440005', 'One element dominates', false, 1),
('b50e8400-e29b-41d4-a716-446655440042', 'a50e8400-e29b-41d4-a716-446655440005', 'All four elements are balanced', true, 2),
('b50e8400-e29b-41d4-a716-446655440043', 'a50e8400-e29b-41d4-a716-446655440005', 'Fire and Water are equal', false, 3),
('b50e8400-e29b-41d4-a716-446655440044', 'a50e8400-e29b-41d4-a716-446655440005', 'Earth and Wind are suppressed', false, 4);

-- Questions for Quiz 2: Sen Lines
INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_type, explanation, display_order) VALUES
(
  'a50e8400-e29b-41d4-a716-446655440011',
  '950e8400-e29b-41d4-a716-446655440002',
  'How many main Sen lines are recognized in Traditional Thai Medicine?',
  'multiple_choice',
  'TTM recognizes 10 main Sen lines through which vital energy (Prana) flows. These are the primary energy pathways treated in Thai therapy.',
  1
),
(
  'a50e8400-e29b-41d4-a716-446655440012',
  '950e8400-e29b-41d4-a716-446655440002',
  'What is the primary therapeutic purpose of working with Sen lines?',
  'multiple_choice',
  'Sen line therapy aims to restore the free flow of energy throughout the body. Blockages in Sen lines are believed to cause disease and discomfort.',
  2
),
(
  'a50e8400-e29b-41d4-a716-446655440013',
  '950e8400-e29b-41d4-a716-446655440002',
  'Sen Sumana runs through which part of the body?',
  'multiple_choice',
  'Sen Sumana is the central line running from the navel through the chest to the mouth. It is considered one of the most important Sen lines.',
  3
),
(
  'a50e8400-e29b-41d4-a716-446655440014',
  '950e8400-e29b-41d4-a716-446655440002',
  'Blockage in Sen lines typically results in:',
  'multiple_choice',
  'When Sen lines are blocked, energy cannot flow freely, leading to pain, stiffness, and various physical and mental ailments.',
  4
);

-- Answers for Sen Quiz Question 1
INSERT INTO public.quiz_answers (id, question_id, answer_text, is_correct, display_order) VALUES
('b50e8400-e29b-41d4-a716-446655440051', 'a50e8400-e29b-41d4-a716-446655440011', '5 main lines', false, 1),
('b50e8400-e29b-41d4-a716-446655440052', 'a50e8400-e29b-41d4-a716-446655440011', '7 main lines', false, 2),
('b50e8400-e29b-41d4-a716-446655440053', 'a50e8400-e29b-41d4-a716-446655440011', '10 main lines', true, 3),
('b50e8400-e29b-41d4-a716-446655440054', 'a50e8400-e29b-41d4-a716-446655440011', '12 main lines', false, 4);

-- Answers for Sen Quiz Question 2
INSERT INTO public.quiz_answers (id, question_id, answer_text, is_correct, display_order) VALUES
('b50e8400-e29b-41d4-a716-446655440061', 'a50e8400-e29b-41d4-a716-446655440012', 'To increase body temperature', false, 1),
('b50e8400-e29b-41d4-a716-446655440062', 'a50e8400-e29b-41d4-a716-446655440012', 'To restore energy flow', true, 2),
('b50e8400-e29b-41d4-a716-446655440063', 'a50e8400-e29b-41d4-a716-446655440012', 'To strengthen muscles', false, 3),
('b50e8400-e29b-41d4-a716-446655440064', 'a50e8400-e29b-41d4-a716-446655440012', 'To improve digestion only', false, 4);

-- Answers for Sen Quiz Question 3
INSERT INTO public.quiz_answers (id, question_id, answer_text, is_correct, display_order) VALUES
('b50e8400-e29b-41d4-a716-446655440071', 'a50e8400-e29b-41d4-a716-446655440013', 'Along the arms', false, 1),
('b50e8400-e29b-41d4-a716-446655440072', 'a50e8400-e29b-41d4-a716-446655440013', 'Through the center of the torso', true, 2),
('b50e8400-e29b-41d4-a716-446655440073', 'a50e8400-e29b-41d4-a716-446655440013', 'Down the legs', false, 3),
('b50e8400-e29b-41d4-a716-446655440074', 'a50e8400-e29b-41d4-a716-446655440013', 'Around the head', false, 4);

-- Answers for Sen Quiz Question 4
INSERT INTO public.quiz_answers (id, question_id, answer_text, is_correct, display_order) VALUES
('b50e8400-e29b-41d4-a716-446655440081', 'a50e8400-e29b-41d4-a716-446655440014', 'Increased flexibility', false, 1),
('b50e8400-e29b-41d4-a716-446655440082', 'a50e8400-e29b-41d4-a716-446655440014', 'Pain and stiffness', true, 2),
('b50e8400-e29b-41d4-a716-446655440083', 'a50e8400-e29b-41d4-a716-446655440014', 'Better sleep quality', false, 3),
('b50e8400-e29b-41d4-a716-446655440084', 'a50e8400-e29b-41d4-a716-446655440014', 'Enhanced appetite', false, 4);