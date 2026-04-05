import type { BagRegisterPayload } from "@/lib/bag-ogc";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div className="grid gap-0.5 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="text-zinc-900 dark:text-zinc-100">{value}</dd>
    </div>
  );
}

export function BagRegisterDetails({ data }: { data: BagRegisterPayload }) {
  return (
    <dl className="space-y-2">
      <Row label="Use" value={data.gebruiksdoel} />
      <Row
        label="Floor area"
        value={
          data.oppervlakteM2 != null
            ? `${data.oppervlakteM2.toLocaleString("en-NL")} m² (BAG oppervlakte)`
            : null
        }
      />
      <Row label="Object status" value={data.vboStatus} />
      <Row label="Street" value={data.openbareRuimteNaam} />
      <Row
        label="Postcode / no."
        value={
          data.postcode && data.huisnummer != null
            ? `${data.postcode} ${data.huisnummer}`
            : null
        }
      />
      <Row label="City" value={data.woonplaatsNaam} />
      <Row label="Pand id" value={data.pandId} />
      <Row label="Pand status" value={data.pandStatus} />
      <Row label="Bouwjaar" value={data.pandBouwjaar ?? undefined} />
      <Row label="Document date" value={data.documentdatum} />
      {data.rdfSeeAlsoVbo ? (
        <div className="pt-1">
          <a
            href={data.rdfSeeAlsoVbo}
            className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            BAG URI (basisregistratie)
          </a>
        </div>
      ) : null}
    </dl>
  );
}
