import { ArrowLeftRight, CalendarDays, Info, Smartphone } from 'lucide-react'
import { RestoreButton } from '@/components/RestoreButton'
import { ReceiveButton, ScanButton } from '@/components/Transfer'
import { TripForm } from '@/components/TripForm'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

/** What the app does, for a traveller who opens it for the first time. */
const features = [
  {
    icon: ArrowLeftRight,
    title: 'Two currencies',
    text: 'Type an amount in the foreign or the home currency. Trxip converts it at your rate.',
  },
  {
    icon: CalendarDays,
    title: 'Day and category totals',
    text: 'See how much you spend each day and on each category.',
  },
  {
    icon: Smartphone,
    title: 'Stays on this device',
    text: 'No account and no internet needed. Back up to a file or export a CSV at any time.',
  },
]

export function SetupScreen() {
  return (
    <main className="mx-auto max-w-lg px-4 pt-[max(env(safe-area-inset-top),3rem)] pb-10 lg:max-w-[640px]">
      <p className="figures text-lg text-muted-foreground">Trxip</p>
      <h1 className="rule-double mt-1 pb-4 font-heading text-[2.5rem] leading-tight font-semibold">
        Set up your trip
      </h1>
      {/* Closed at the start, so the form stays near the top of the screen. */}
      <Accordion type="single" collapsible className="mt-3 border-b border-border">
        <AccordionItem value="about">
          <AccordionTrigger className="items-center gap-3 py-3 font-heading text-[17px] font-semibold hover:no-underline">
            <Info className="size-5 shrink-0 text-brand" strokeWidth={1.75} aria-hidden />
            What is Trxip?
          </AccordionTrigger>
          <AccordionContent className="pb-5 text-base">
            <p className="text-lg">
              Trxip tracks what you spend on a trip. It shows each amount in your home currency and in the currency of
              the country you visit.
            </p>
            <ul className="mt-4 space-y-4">
              {features.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <Icon className="mt-0.5 size-5 shrink-0 text-brand" strokeWidth={1.75} aria-hidden />
                  <div>
                    <div className="font-heading text-[17px] font-semibold">{title}</div>
                    <div className="text-muted-foreground">{text}</div>
                  </div>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <p className="mt-6 mb-8 text-muted-foreground">
        Choose your currencies and type today's rate. You can change the rate at any time.
      </p>
      <TripForm submitLabel="Start tracking" />
      <div className="mt-10 border-t border-border pt-5 text-muted-foreground">
        <p>Is your trip on another device?</p>
        {/* A phone scans the code. A computer shows it. */}
        <div className="flex flex-col items-start gap-1">
          <ScanButton data={null} variant="link">
            Scan code
          </ScanButton>
          <ReceiveButton expenseCount={0} variant="link">
            Show a code to receive
          </ReceiveButton>
          <RestoreButton expenseCount={0} variant="link" />
        </div>
      </div>
    </main>
  )
}
