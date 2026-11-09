---
name: AquaBest
description: Water-delivery auth in charcoal, white, and ice-cyan.
colors:
  brand: "#222222"
  surface: "#FFFFFF"
  accent: "#7EF0FF"
  ink: "#222222"
  ink-muted: "#5C5C5C"
  line: "#E5E5E5"
  danger: "#B42318"
  hero-ground: "#1A1A1A"
typography:
  display:
    fontFamily: "system-ui, ui-sans-serif, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "system-ui, ui-sans-serif, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0em"
  label:
    fontFamily: "system-ui, ui-sans-serif, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0em"
rounded:
  sm: "12px"
  md: "16px"
  lg: "32px"
  full: "999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "14px 24px"
    height: "48px"
  button-primary-disabled:
    backgroundColor: "#B3B3B3"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    height: "48px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    height: "48px"
---

# AquaBest design

## Overview

Auth screens are a water-plant threshold: an isometric charcoal-and-ice-cyan illustration fills the top of the phone, and a white sheet overlaps it. The official AquaBest wordmark sits on the sheet. After login, the product stays quiet — charcoal type on white, no hero.

Operate mode. System sans. Ice-cyan is illustration, focus, and seals — never body text on white.

## Colors

| Token | Hex | Role |
| --- | --- | --- |
| brand | `#222222` | Primary fill, display ink, hero charcoal |
| surface | `#FFFFFF` | Sheets, fields, post-login ground |
| accent | `#7EF0FF` | Illustration highlight, focus ring, success seal |
| ink-muted | `#5C5C5C` | Supporting copy on white |
| danger | `#B42318` | Field and form errors |

Do not use the purple mock palette. Do not put accent on white as running text.

## Typography

System UI stack (San Francisco on iOS, Roboto on Android, system-ui on web). Titles 28px/bold, body 16px, labels 14px/medium. No display webfont.

## Layout

Native auth is full-bleed. Hero band is about 40% of the viewport. The sheet overlaps the hero with a large top radius (`32px`). Web auth is the same composition in a phone-width column on a light canvas. Post-login screens use a simple padded column.

## Elevation & Depth

The sheet sits above the hero with a soft offset shadow (y > 0, blur). No neon halo, no hard neobrutal offset.

## Shapes

Fields and buttons `16px`. Sheet top `32px`. OTP cells square-rounded `12px`. Success seal is a circle with a check, charcoal fill, ice-cyan ring.

## Components

- **Primary button:** charcoal, white label, full width, 48px tall, loading spinner in white.
- **Input:** labeled, 48px, charcoal focus border (accent ring allowed), red border + message on error.
- **OTP:** six cells, auto-advance, numeric keypad.
- **Checkbox:** 24px box, charcoal when on.
- **Logo:** existing PNG, original aspect, never regenerated.

## Do's and Don'ts

- Do use the official wordmark on the auth sheet.
- Do keep login, OTP, and success in the overlapping-sheet composition.
- Don't add Google/Apple buttons.
- Don't put a Sign up link on the driver app.
- Don't store tokens in AsyncStorage.
- Don't invent photography or testimonials.
