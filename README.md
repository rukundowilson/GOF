# GOF+ — practical farming support in one place

GOF+ is a mobile-first farming companion built to help farmers find useful guidance and services without having to search across many different places. It brings crop support, planning tools, and links to national agriculture programs into one simple experience.

The app is designed for farmers who need clear next steps: understand what may be affecting a crop, make better informed choices before planting, and find the right channel for existing support programs.

## The problem GOF+ is trying to solve

Helpful farming information is often scattered. A farmer may need to ask several people or visit different websites to investigate a crop problem, make sense of soil results, check local conditions, or learn how to access a government program. That takes time, and important services can be difficult to discover—especially when the farmer does not know their official name or where to start.

GOF+ provides a simpler starting point. It brings practical tools and routes to relevant services together, explains what each one can help with, and makes common next steps easier to reach from a phone.

## Services

### Crop diagnosis

Take or choose a photo of a crop to get an AI-supported assessment of visible signs of pests, disease, or plant stress, along with treatment guidance. Farmers can review and keep a record of past assessments on their device.

An image-based assessment is a starting point for investigation, not a guaranteed diagnosis. Check important treatment decisions with a qualified agriculture adviser and follow product labels.

### Pre-Season Analysis

Use soil laboratory results and a selected location to review local conditions and crop or seed options before planting. The analysis brings these details together to help farmers think through their plans and understand the reasons behind suggested varieties.

Recommendations are guidance for planning. Actual results depend on the field, season, seed availability, and other local conditions.

### National programs: one easy place to start

National agriculture support can be spread across different agencies, websites, and phone services. A farmer might hear about a program but still be unsure what it offers, whether it applies to them, or how to take the next step.

GOF+ brings descriptions and access routes for existing programs onto one page. It is a convenient guide to services provided by their respective organizations; it does not replace those organizations or decide who qualifies. From the page, farmers can find information about:

- **Smart Nkunganire** — subsidized agricultural inputs, with website information and a USSD route such as *774#.
- **Smart Kungahara** — digital records and payments for coffee, tea, and other cash-crop farmers, including access by *774*2#.
- **Tekana Urishingiwe** — information about agricultural insurance and protection against farming risks.
- **Twigire Muhinzi** — farmer-centered agriculture advice and extension support.

Program terms, eligibility, and access methods can change. GOF+ links farmers to the relevant official service so they can confirm current details.

## Get GOF+

**The app is recommended for the best experience.** The web version is available when installing the app is not convenient, though it may have more limited performance.

- **Android app:** [Download GOF+](https://gof--z6786xck32.expo.app/share-assets/gof-installer.apk) — the hosted share page expects the APK at `public/share-assets/gof-installer.apk`.
- **Web version:** [Open GOF+ in your browser](https://gof--z6786xck32.expo.app/).

To share GOF+ with farmers, send them the web link above. The share page presents an app download button and a web option. Once an Android APK has been uploaded to the expected path and the site redeployed, the download button will deliver it directly.

## Technology

- **Languages:** TypeScript for the application and API routes; JavaScript for some project configuration and scripts.
- **App framework:** React Native with Expo, targeting Android, iOS, and web.
- **Navigation:** Expo Router with file-based routes.
- **Web support:** React Native Web lets the shared interface run in a browser.
- **AI analysis:** Google Gemini through the `@google/genai` SDK, called from server API routes for crop diagnosis and pre-season analysis.
- **Device features:** Expo camera and image picker for crop photos, Expo Location for the farmer's selected location, and local file/device storage for app data.

## Run the project locally

You need Node.js and npm installed.

```bash
npm install
npx expo start
```

Use the Expo development menu to open the app on a connected device or emulator. To run the browser version, use:

```bash
npm run web
```

The AI tools need a working Gemini API configuration on the server routes. The web and mobile interface can be explored separately from AI requests if that service is unavailable.

## Build an Android app

The project uses EAS Build. To create an Android preview build:

```bash
npx eas-cli build --platform android --profile preview
```

After the build finishes, upload the APK to `public/share-assets/gof-installer.apk` and deploy the web project again. This keeps the download button on the share page connected to the latest app file.

## Project map

- `src/app/` — app screens, navigation routes, and server API routes.
- `src/components/` — service screens and reusable interface components.
- `src/utils/` — shared data handling and analysis types.
- `assets/` — app illustrations, icons, and reference datasets.
- `public/share.html` — the app download and web version share page.
- `public/share-assets/` — images and files used by the share page, including the expected location for the Android APK.
