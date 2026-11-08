// app/components/windowContent.tsx
import type { WindowId } from "./DraggableWindow";
import { AProposContent } from "../windows/AProposContent";
import { ReglementContent } from "../windows/ReglementContent";
import { LiensContent } from "../windows/LiensContent";
import { FaqContent } from "../windows/FaqContent";
import { CompetitionContent } from "../windows/CompetitionContent";
import { InscriptionsContent } from "../windows/InscriptionsContent";
import { BracketContent } from "../windows/BracketContent";
import { FormationContent } from "../windows/FormationContent";
import { QuestionsContent } from "../windows/QuestionsContent";

type WindowContentProps = {
  id: WindowId;
  openWindow: (id: WindowId) => void;
  isDark: boolean;
  openWindowIds: WindowId[];
  soundEnabled: boolean;
};

export function WindowContent({ id, openWindow, isDark, openWindowIds, soundEnabled }: WindowContentProps) {
  if (id === "a-propos") return <AProposContent />;
  if (id === "reglement") return <ReglementContent />;
  if (id === "liens") return <LiensContent soundEnabled={soundEnabled} />;
  if (id === "faq") return <FaqContent />;
  if (id === "competition") return <BracketContent />;
  if (id === "inscriptions") return <InscriptionsContent />;
  if (id === "bracket") return <BracketContent />;
  if (id === "formation") return <FormationContent />;
  if (id === "questions") return <QuestionsContent />;
  return null;
}
