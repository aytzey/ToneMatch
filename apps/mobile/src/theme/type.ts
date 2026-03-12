import { TextStyle } from "react-native";

const fontFamily = "Manrope_700Bold";
const fontFamilyMedium = "Manrope_500Medium";
const fontFamilyRegular = "Manrope_400Regular";
const fontFamilySemiBold = "Manrope_600SemiBold";
const fontFamilyExtraBold = "Manrope_800ExtraBold";
const displayFamily = "CormorantGaramond_600SemiBold";
const displayFamilyMedium = "CormorantGaramond_500Medium";
const displayFamilyItalic = "CormorantGaramond_600SemiBold_Italic";

export const type: Record<string, TextStyle> = {
  hero: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: fontFamily,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: fontFamily,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: fontFamily,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  displayHero: {
    fontSize: 38,
    lineHeight: 40,
    fontFamily: displayFamily,
    fontWeight: "600",
    letterSpacing: -0.8,
  },
  displayTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontFamily: displayFamily,
    fontWeight: "600",
    letterSpacing: -0.6,
  },
  displaySection: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: displayFamilyMedium,
    fontWeight: "500",
    letterSpacing: -0.4,
  },
  displayItalic: {
    fontSize: 30,
    lineHeight: 34,
    fontFamily: displayFamilyItalic,
    fontWeight: "600",
    letterSpacing: -0.6,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fontFamilyRegular,
    fontWeight: "400",
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: fontFamilySemiBold,
    fontWeight: "600",
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamilyMedium,
    fontWeight: "500",
  },
  overline: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamilyExtraBold,
    fontWeight: "800",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  sectionHeader: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: fontFamily,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
};
