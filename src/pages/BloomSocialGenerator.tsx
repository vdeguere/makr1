import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, RefreshCw, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
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

const DEFAULT_FORM: FormState = {
  environment: "educational",
  audience: "both",
  benefitFocus: "all",
  tone: "empowering",
  postLength: "medium",
  includeHashtags: true,
  includeEmojis: true,
  includeCta: true,
  ctaType: "Drop a 🌸 in the comments if this resonates with you!",
  customNote: "",
};

// ─── Option data ───────────────────────────────────────────────────────────────

const ENVIRONMENTS = [
  { value: "educational", label: "Educational / Informational" },
  { value: "promotional", label: "Promotional / Product Spotlight" },
  { value: "success_story", label: "Success Story / Transformation" },
  { value: "challenge", label: "Question / Engagement Post" },
  { value: "testimonial", label: "Customer Testimonial Style" },
  { value: "myth_bust", label: "Myth Buster" },
  { value: "behind_scenes", label: "Behind the Ingredients" },
  { value: "holiday", label: "Holiday / Seasonal" },
];

const AUDIENCES = [
  { value: "perimenopause", label: "Perimenopause Women (35–45)" },
  { value: "postmenopause", label: "Post-Menopause Women (45–60)" },
  { value: "both", label: "Both Audiences" },
];

const BENEFITS = [
  { value: "all", label: "All Benefits (Full Overview)" },
  { value: "Muscle preservation & metabolism — 16g protein + 5g creatine", label: "Muscle & Metabolism" },
  { value: "Skin elasticity & anti-aging — collagen, hyaluronic acid, phytoceramides", label: "Skin & Anti-Aging" },
  { value: "Bone density protection — calcium, vitamin D3, K2, magnesium", label: "Bone Density & Strength" },
  { value: "Hormone balance & mood stability — maca root and ashwagandha adaptogens", label: "Hormone Balance & Mood" },
  { value: "Energy & cognitive support — vitamin B12 and iron", label: "Energy & Brain Clarity" },
  { value: "Gut health & bloating reduction — GOS prebiotic, bromelain & papain enzymes", label: "Gut Health & Digestion" },
  { value: "Heart & anti-inflammation support — omega-3 from flaxseed", label: "Heart Health" },
];

const TONES = [
  { value: "empowering", label: "Empowering & Bold" },
  { value: "nurturing", label: "Warm & Nurturing" },
  { value: "scientific", label: "Science-Backed & Credible" },
  { value: "conversational", label: "Conversational & Relatable" },
  { value: "urgent", label: "Urgent / FOMO" },
  { value: "inspirational", label: "Inspirational & Motivational" },
];

const POST_LENGTHS = [
  { value: "short", label: "Short (~100 words)" },
  { value: "medium", label: "Medium (~200 words)" },
  { value: "long", label: "Long (~350 words)" },
];

const CTA_OPTIONS = [
  { value: "Drop a 🌸 in the comments if this resonates with you!", label: "Engagement: Drop a comment" },
  { value: "Tag a friend who needs to hear this today.", label: "Tag a Friend" },
  { value: "Click the link in bio to learn more about BLOOM.", label: "Learn More (bio link)" },
  { value: "Shop BLOOM now — link in bio.", label: "Shop Now" },
  { value: "Save this post — you'll want to come back to it.", label: "Save Post" },
  { value: "Have questions? Drop them below — we'd love to help!", label: "Ask a Question" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function BloomSocialGenerator() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [generatedPost, setGeneratedPost] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);

  const set = (key: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedPost("");
    try {
      const { data, error } = await supabase.functions.invoke("generate-bloom-post", {
        body: form,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setGeneratedPost(data.post ?? "");
    } catch (err) {
      toast.error("Failed to generate post. Please try again.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedPost) return;
    navigator.clipboard.writeText(generatedPost);
    toast.success("Post copied to clipboard!");
  };

  const wordCount = generatedPost
    ? generatedPost.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50">
      {/* Header */}
      <header className="border-b border-rose-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            B
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">BLOOM Post Generator</h1>
            <p className="text-xs text-gray-500">Facebook social content for women's wellness</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
        {/* ── Left panel: Controls ── */}
        <section className="space-y-6">
          {/* Product quick-reference */}
          <div className="rounded-2xl border border-rose-100 bg-white/70 p-4 shadow-sm">
            <button
              className="flex items-center justify-between w-full text-left"
              onClick={() => setShowIngredients((v) => !v)}
            >
              <span className="text-sm font-semibold text-rose-700">
                BLOOM Product Reference
              </span>
              {showIngredients ? (
                <ChevronUp className="w-4 h-4 text-rose-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-rose-400" />
              )}
            </button>
            {showIngredients && (
              <div className="mt-3 space-y-2 text-xs text-gray-600 leading-relaxed">
                <p className="font-medium text-gray-700">36g Chocolate Pouch — Key ingredients:</p>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1 list-disc list-inside">
                  <li>Whey + Pea + Pumpkin Protein (16g)</li>
                  <li>Creatine 5g</li>
                  <li>Marine Collagen 4g</li>
                  <li>Hyaluronic Acid</li>
                  <li>Phytoceramides</li>
                  <li>Maca Root + Ashwagandha</li>
                  <li>Calcium + D3 + K2 + Mg</li>
                  <li>GOS Prebiotic + Enzymes</li>
                  <li>Omega-3 (Flaxseed)</li>
                  <li>B12 + Iron</li>
                </ul>
                <p className="italic text-rose-600 font-medium mt-1">
                  "After 40, protein alone is not enough."
                </p>
              </div>
            )}
          </div>

          {/* Post Environment */}
          <div className="rounded-2xl border border-rose-100 bg-white/70 p-5 shadow-sm space-y-5">
            <h2 className="font-semibold text-gray-800">Post Settings</h2>

            <div className="space-y-2">
              <Label className="text-sm text-gray-700">Post Format / Environment</Label>
              <Select value={form.environment} onValueChange={(v) => set("environment", v)}>
                <SelectTrigger className="border-rose-200 focus:ring-rose-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENVIRONMENTS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-700">Target Audience</Label>
              <Select value={form.audience} onValueChange={(v) => set("audience", v)}>
                <SelectTrigger className="border-rose-200 focus:ring-rose-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-700">Benefit Focus</Label>
              <Select value={form.benefitFocus} onValueChange={(v) => set("benefitFocus", v)}>
                <SelectTrigger className="border-rose-200 focus:ring-rose-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BENEFITS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-700">Tone</Label>
              <Select value={form.tone} onValueChange={(v) => set("tone", v)}>
                <SelectTrigger className="border-rose-200 focus:ring-rose-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-700">Post Length</Label>
              <Select value={form.postLength} onValueChange={(v) => set("postLength", v)}>
                <SelectTrigger className="border-rose-200 focus:ring-rose-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POST_LENGTHS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Extras */}
          <div className="rounded-2xl border border-rose-100 bg-white/70 p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-800">Extras</h2>

            <div className="flex items-center justify-between">
              <Label className="text-sm text-gray-700">Include Emojis</Label>
              <Switch
                checked={form.includeEmojis}
                onCheckedChange={(v) => set("includeEmojis", v)}
                className="data-[state=checked]:bg-rose-400"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm text-gray-700">Include Hashtags</Label>
              <Switch
                checked={form.includeHashtags}
                onCheckedChange={(v) => set("includeHashtags", v)}
                className="data-[state=checked]:bg-rose-400"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm text-gray-700">Include Call-to-Action</Label>
              <Switch
                checked={form.includeCta}
                onCheckedChange={(v) => set("includeCta", v)}
                className="data-[state=checked]:bg-rose-400"
              />
            </div>

            {form.includeCta && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">Call-to-Action Type</Label>
                <Select value={form.ctaType} onValueChange={(v) => set("ctaType", v)}>
                  <SelectTrigger className="border-rose-200 focus:ring-rose-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CTA_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm text-gray-700">
                Additional Notes{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Textarea
                placeholder="e.g. Mention a seasonal sale, specific event, or particular angle you want highlighted…"
                value={form.customNote}
                onChange={(e) => set("customNote", e.target.value)}
                rows={3}
                className="border-rose-200 focus:ring-rose-300 text-sm resize-none"
              />
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full h-12 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-semibold rounded-xl shadow-md transition-all"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Facebook Post
              </>
            )}
          </Button>
        </section>

        {/* ── Right panel: Output ── */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-rose-100 bg-white/70 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-rose-50">
              <div>
                <h2 className="font-semibold text-gray-800">Generated Post</h2>
                {generatedPost && (
                  <p className="text-xs text-gray-400 mt-0.5">{wordCount} words</p>
                )}
              </div>
              {generatedPost && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs"
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${isGenerating ? "animate-spin" : ""}`} />
                    Regenerate
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCopy}
                    className="bg-rose-500 hover:bg-rose-600 text-white text-xs"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
              )}
            </div>

            <div className="flex-1 p-5">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 py-20">
                  <RefreshCw className="w-8 h-8 animate-spin text-rose-300" />
                  <p className="text-sm">Crafting your post…</p>
                </div>
              ) : generatedPost ? (
                <div className="space-y-4">
                  {/* Facebook post mock */}
                  <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center text-white font-bold text-sm">
                        B
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 leading-none">BLOOM Official</p>
                        <p className="text-xs text-gray-400 mt-0.5">Just now · Facebook</p>
                      </div>
                    </div>
                    <div className="px-4 py-4">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {generatedPost}
                      </p>
                    </div>
                  </div>

                  {/* Raw text area for easy editing */}
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Edit before posting</Label>
                    <Textarea
                      value={generatedPost}
                      onChange={(e) => setGeneratedPost(e.target.value)}
                      rows={10}
                      className="border-rose-100 text-sm leading-relaxed resize-none bg-rose-50/30 focus:ring-rose-200"
                    />
                  </div>

                  <Button
                    onClick={handleCopy}
                    className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-medium rounded-xl"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Post to Clipboard
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 py-20">
                  <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-rose-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Your post will appear here</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Configure your settings and click Generate
                    </p>
                  </div>

                  {/* Quick-start tips */}
                  <div className="mt-4 w-full max-w-xs space-y-2">
                    <p className="text-xs font-medium text-gray-400 text-center">BLOOM's core message</p>
                    <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-center">
                      <p className="text-xs text-rose-700 font-medium italic">
                        "After 40, protein alone is not enough."
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div className="rounded-lg bg-amber-50 border border-amber-100 p-2 text-center">
                        <p className="font-semibold text-amber-700">16g Protein</p>
                        <p>+ 5g Creatine</p>
                      </div>
                      <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2 text-center">
                        <p className="font-semibold text-emerald-700">4g Collagen</p>
                        <p>+ Ceramides + HA</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-6 text-center text-xs text-gray-400 border-t border-rose-100 mt-4">
        BLOOM Social Post Generator · For women 40+ who refuse to settle · Internal marketing tool
      </footer>
    </div>
  );
}
