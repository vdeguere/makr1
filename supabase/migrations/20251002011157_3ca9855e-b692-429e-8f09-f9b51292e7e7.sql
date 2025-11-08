-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'practitioner', 'patient');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  license_number TEXT,
  specialization TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  medical_history TEXT,
  allergies TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Create herbs table
CREATE TABLE public.herbs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  thai_name TEXT,
  scientific_name TEXT,
  description TEXT,
  properties TEXT,
  dosage_instructions TEXT,
  contraindications TEXT,
  cost_per_unit DECIMAL(10,2),
  retail_price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.herbs ENABLE ROW LEVEL SECURITY;

-- Create recommendations table
CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  diagnosis TEXT,
  instructions TEXT,
  duration_days INTEGER,
  total_cost DECIMAL(10,2),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'ordered', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Create recommendation_items table
CREATE TABLE public.recommendation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID REFERENCES public.recommendations(id) ON DELETE CASCADE NOT NULL,
  herb_id UUID REFERENCES public.herbs(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL,
  dosage_instructions TEXT,
  unit_price DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recommendation_items ENABLE ROW LEVEL SECURITY;

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID REFERENCES public.recommendations(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create herb_interactions table
CREATE TABLE public.herb_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  herb_id_1 UUID REFERENCES public.herbs(id) ON DELETE CASCADE NOT NULL,
  herb_id_2 UUID REFERENCES public.herbs(id) ON DELETE CASCADE NOT NULL,
  interaction_type TEXT CHECK (interaction_type IN ('warning', 'caution', 'contraindicated')),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (herb_id_1, herb_id_2)
);

ALTER TABLE public.herb_interactions ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

-- Create trigger for new user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_patients_updated_at BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_herbs_updated_at BEFORE UPDATE ON public.herbs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_recommendations_updated_at BEFORE UPDATE ON public.recommendations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for patients
CREATE POLICY "Practitioners can view their own patients"
  ON public.patients FOR SELECT
  USING (public.has_role(auth.uid(), 'practitioner') AND practitioner_id = auth.uid());

CREATE POLICY "Practitioners can create patients"
  ON public.patients FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'practitioner') AND practitioner_id = auth.uid());

CREATE POLICY "Practitioners can update their own patients"
  ON public.patients FOR UPDATE
  USING (public.has_role(auth.uid(), 'practitioner') AND practitioner_id = auth.uid());

CREATE POLICY "Practitioners can delete their own patients"
  ON public.patients FOR DELETE
  USING (public.has_role(auth.uid(), 'practitioner') AND practitioner_id = auth.uid());

-- RLS Policies for herbs
CREATE POLICY "Authenticated users can view herbs"
  ON public.herbs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage herbs"
  ON public.herbs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for recommendations
CREATE POLICY "Practitioners can view their own recommendations"
  ON public.recommendations FOR SELECT
  USING (public.has_role(auth.uid(), 'practitioner') AND practitioner_id = auth.uid());

CREATE POLICY "Practitioners can create recommendations"
  ON public.recommendations FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'practitioner') AND practitioner_id = auth.uid());

CREATE POLICY "Practitioners can update their own recommendations"
  ON public.recommendations FOR UPDATE
  USING (public.has_role(auth.uid(), 'practitioner') AND practitioner_id = auth.uid());

CREATE POLICY "Practitioners can delete their own recommendations"
  ON public.recommendations FOR DELETE
  USING (public.has_role(auth.uid(), 'practitioner') AND practitioner_id = auth.uid());

-- RLS Policies for recommendation_items
CREATE POLICY "Users can view recommendation items"
  ON public.recommendation_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recommendations
      WHERE id = recommendation_id AND practitioner_id = auth.uid()
    )
  );

CREATE POLICY "Practitioners can manage recommendation items"
  ON public.recommendation_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.recommendations
      WHERE id = recommendation_id AND practitioner_id = auth.uid()
    )
  );

-- RLS Policies for orders
CREATE POLICY "Users can view related orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recommendations
      WHERE recommendations.id = orders.recommendation_id
      AND recommendations.practitioner_id = auth.uid()
    )
  );

CREATE POLICY "Practitioners can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recommendations
      WHERE recommendations.id = orders.recommendation_id
      AND recommendations.practitioner_id = auth.uid()
    )
  );

CREATE POLICY "Practitioners can update orders"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.recommendations
      WHERE recommendations.id = orders.recommendation_id
      AND recommendations.practitioner_id = auth.uid()
    )
  );

-- RLS Policies for herb_interactions
CREATE POLICY "Authenticated users can view herb interactions"
  ON public.herb_interactions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage herb interactions"
  ON public.herb_interactions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));