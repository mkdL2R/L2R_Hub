import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/lib/hub-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, PartyPopper, ScrollText, ShieldCheck, Sprout, Users } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/family-commitment")({
  head: () => ({ meta: [{ title: "Family Commitment — L2R" }] }),
  component: FamilyCommitmentPage,
});

const AGREEMENT_VERSION = "2026.01";
const AGREEMENT_TEXT = `Left2Right (L2R) Family Commitment Agreement

At L2R, admissions are a mutual choice. This commitment marks the beginning of a
long-term partnership between your family and our learning community.

1. Partnership. We commit to walk alongside our learner as active partners with
   L2R instructors, mentors, and staff. We understand that our engagement is the
   single strongest predictor of our child's growth.

2. Presence. We will honor scheduled sessions, respond to communications within a
   reasonable time, and give our learner the space and rhythm to engage with the
   program consistently.

3. Growth over performance. We embrace L2R's ecosystem approach: we value
   character, curiosity, and craft over grades or comparison. We will support
   reflection, struggle, and iteration as essential parts of learning.

4. Respect. We treat every member of the community — learners, families, and
   instructors — with respect, honesty, and kindness. Disagreements are welcomed
   as opportunities for dialogue.

5. Confidentiality. We keep private information shared within the community
   private, and we celebrate other families' journeys as we would our own.

6. Financial commitment. We agree to the tuition and fee structure communicated
   to us during admissions, and to reach out early if our circumstances change.

7. Living document. This commitment is a beginning, not an ending. We will
   revisit it as our family, our learner, and L2R grow together.

By signing below, we affirm that we have read this agreement, discussed it as a
family, and choose to enter the L2R Learning Ecosystem with intention.`;

function FamilyCommitmentPage() {
  const { user, loading } = useAuthUser();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [existing, setExisting] = useState<{ id: string; signed_at: string | null } | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      const { data: fm } = await supabase
        .from("family_members")
        .select("family_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (fm?.family_id) {
        const { data } = await supabase
          .from("family_commitments")
          .select("id, signed_at, status")
          .eq("family_id", fm.family_id)
          .eq("status", "signed")
          .maybeSingle();
        if (data) setExisting({ id: data.id, signed_at: data.signed_at });
      }
      setChecking(false);
    })();
  }, [loading, user]);

  async function handleSign() {
    setError(null);
    setSubmitting(true);
    const { error } = await supabase.rpc("sign_family_commitment", {
      _agreement_version: AGREEMENT_VERSION,
      _agreement_text: AGREEMENT_TEXT,
      _signature_name: signature.trim(),
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setCelebrate(true);
  }

  if (loading || checking) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (celebrate || existing) {
    return (
      <div className="min-h-screen px-6 py-16 max-w-2xl mx-auto">
        <Card className="p-10 text-center space-y-6 card-paper">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 grid place-items-center">
            <PartyPopper className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-serif">🎉 Welcome to the L2R Learning Ecosystem!</h1>
            <p className="text-muted-foreground">
              Your family has officially completed the admissions journey.
            </p>
            {existing?.signed_at && (
              <p className="text-xs text-muted-foreground">
                Signed {format(new Date(existing.signed_at), "PPP")} · Agreement v{AGREEMENT_VERSION}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button asChild size="lg">
              <Link to="/family-dashboard"><Users className="h-4 w-4 mr-2" /> Go to Family Dashboard</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/hub"><Sprout className="h-4 w-4 mr-2" /> Explore the Growth Hub</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const canSign = agreed && signature.trim().length >= 2 && !submitting;

  return (
    <div className="min-h-screen px-6 py-10 max-w-3xl mx-auto space-y-6">
      <Link to="/family-dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to dashboard
      </Link>

      <Card className="p-8 space-y-4 card-paper">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-serif">Family Commitment</h1>
            <p className="text-sm text-muted-foreground">
              The final step of the admissions journey.
            </p>
          </div>
        </div>
        <div className="text-sm leading-relaxed text-muted-foreground space-y-3">
          <p>
            <strong className="text-foreground">Why L2R asks for this.</strong> Our learning
            ecosystem depends on trust between families, learners, and instructors. This
            commitment names the shared intentions that make the partnership work — not a
            legal formality, but a promise you're choosing on purpose.
          </p>
        </div>
      </Card>

      <Card className="p-8 space-y-4 card-paper">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-primary" />
          <h2 className="font-serif text-lg">Family Commitment Agreement</h2>
          <span className="ml-auto text-xs text-muted-foreground">v{AGREEMENT_VERSION}</span>
        </div>
        <div className="max-h-80 overflow-y-auto rounded-lg border border-border/60 bg-background/40 p-4 text-sm whitespace-pre-line leading-relaxed">
          {AGREEMENT_TEXT}
        </div>
      </Card>

      <Card className="p-8 space-y-6 card-paper">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} />
          <span className="text-sm">I have read and agree to the Family Commitment.</span>
        </label>

        <div className="space-y-2">
          <label className="text-sm font-medium">Typed signature</label>
          <Input
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Type your full name"
            maxLength={120}
          />
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Date: {format(new Date(), "PPP")}</span>
          <span>Agreement version: {AGREEMENT_VERSION}</span>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end">
          <Button size="lg" disabled={!canSign} onClick={handleSign}>
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Sign & complete admissions
          </Button>
        </div>
      </Card>
    </div>
  );
}