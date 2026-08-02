# Downtown VIP – prosjektkrav

## Produkt

- Bygg en enkel, installérbar mobilnettside som oppleves som en egen iPhone-app.
- Prioriter Safari og «Legg til på Hjem-skjermen» på iPhone 12–16, inkludert Pro- og Pro Max-modeller.
- Hold løsningen liten og lett å vedlikeholde. Ikke innfør nye rammeverk, tjenester eller abstraksjoner uten et konkret behov.
- All tekst brukeren ser skal være på norsk.

## Tilgang

- Tilgangskoder skal lagres varig i Upstash Redis og overleve redeploys.
- En kode er en engangskode og skal bindes til den første aktiverte sesjonen.
- Nye koder skal ha en påkrevd kommentar om hvem de er til.
- Tilgang kan være ubegrenset eller vare et valgt antall dager. En tidsbegrenset tilgang skal aldri forlenges av klientcache.
- Ubegrensede nettlesersesjoner bruker en rullerende cookie på 400 dager.
- En vellykket servergodkjenning kan caches lokalt i én time for rask åpning. Etter dette skal serveren kontrollere sesjon, kode, utløp og eventuell sperring på nytt.
- En sperring i adminpanelet kan derfor bruke opptil én time på å slå inn på en enhet med gyldig cache.
- Hemmeligheter, adminpassord og Redis-nøkler skal kun ligge i miljøvariabler og aldri committes.

## Innsjekking

- «Sjekk inn» er kun frontendlogikk og skal ikke gjøre et API- eller Redis-kall.
- Et trykk skal vise et tidspunkt nøyaktig åtte timer frem i tid.
- Innsjekkingstidspunktet skal lagres lokalt og overleve lukking og gjenåpning av appen.

## Design

- De leverte referansebildene er visuell fasit. Målet er picture-perfect likhet, ikke en nytolkning.
- Designet skal være portrettorientert, sentrert og fungere fra omtrent 360 til 440 CSS-piksler i bredden.
- Bevar svart bakgrunn, VIP-medaljen, danserne, gullnavneplaten, typografihierarkiet og de etablerte vertikale avstandene.
- Dansersilhuettene skal vises som `rgb(38 25 26)`.
- «Sjekk inn»-knappen skal bruke den leverte tekstgrafikken og den blanke, lyse pillestilen fra referansen. Målstørrelsen er omtrent 206 × 58 CSS-piksler.
- Dynamisk navn skal alltid være ekte tekst og aldri bakes inn i et bilde.
- Respekter iOS safe areas og unngå layoutskift mellom knapp- og tidsvisning.

## Appopplevelse og tilgjengelighet

- Vanlig UI-tekst og bilder skal ikke kunne markeres, dras eller åpne iOS-callout ved langt trykk.
- Dokumentet skal ikke ha unødvendig overscroll/bounce.
- Navn- og kodefelt skal fortsatt støtte normal markør, markering og redigering.
- Bildebasert knappetekst skal ha en tilgjengelig tekstetikett for skjermlesere.
- Interaktive elementer skal beholde tydelig tastaturfokus og tilstrekkelig trykkflate.

## Verifisering

- Kjør TypeScript-kontroll og produksjonsbuild etter funksjonelle endringer.
- Kontroller designendringer i en mobil viewport, fortrinnsvis 390 × 844 CSS-piksler, mot den relevante referansen.
- Kontroller at frontend-innsjekking ikke sender nettverkskall, og at én-times cache kan åpne passet uten tilgangs-API-kall.
- Ikke overskriv eller inkluder urelaterte lokale brukerendringer i commits.
