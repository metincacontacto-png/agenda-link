"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { BusinessAdminDTO } from "@/features/businesses/contracts";
import type { BrandingFormState } from "./contracts";

export function useBrandingEditor(
  business: BusinessAdminDTO | null,
  slug: string,
  onSaved: () => Promise<void>,
) {
  const [landingTitle, setLandingTitle] = useState("");
  const [landingSubtitle, setLandingSubtitle] = useState("");
  const [landingAbout, setLandingAbout] = useState("");
  const [landingCoverUrl, setLandingCoverUrl] = useState("");
  const [landingSecondaryCoverUrl, setLandingSecondaryCoverUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [landingPhone, setLandingPhone] = useState("");
  const [landingAddress, setLandingAddress] = useState("");
  const [landingHours, setLandingHours] = useState("");
  const [feat1Title, setFeat1Title] = useState("");
  const [feat1Desc, setFeat1Desc] = useState("");
  const [feat2Title, setFeat2Title] = useState("");
  const [feat2Desc, setFeat2Desc] = useState("");
  const [feat3Title, setFeat3Title] = useState("");
  const [feat3Desc, setFeat3Desc] = useState("");
  const [test1Name, setTest1Name] = useState("");
  const [test1Text, setTest1Text] = useState("");
  const [test1Stars, setTest1Stars] = useState(5);
  const [test2Name, setTest2Name] = useState("");
  const [test2Text, setTest2Text] = useState("");
  const [test2Stars, setTest2Stars] = useState(5);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!business) return;
    setLandingTitle(business.landingTitle || "");
    setLandingSubtitle(business.landingSubtitle || "");
    setLandingAbout(business.landingAbout || "");
    setLandingCoverUrl(business.landingCoverUrl || "");
    setLandingSecondaryCoverUrl(business.landingSecondaryCoverUrl || "");
    setLogoUrl(business.logoUrl || "");
    setLandingPhone(business.landingPhone || "");
    setLandingAddress(business.landingAddress || "");
    setLandingHours(business.landingHours || "");

    try {
      const features: Array<{ title?: string; desc?: string }> = JSON.parse(business.landingFeaturesJson || "[]");
      if (features.length >= 3) {
        setFeat1Title(features[0]?.title || "");
        setFeat1Desc(features[0]?.desc || "");
        setFeat2Title(features[1]?.title || "");
        setFeat2Desc(features[1]?.desc || "");
        setFeat3Title(features[2]?.title || "");
        setFeat3Desc(features[2]?.desc || "");
      }
    } catch (error) {
      console.error("Error parsing landingFeaturesJson:", error);
    }

    try {
      const testimonials: Array<{ name?: string; text?: string; stars?: number }> = JSON.parse(business.landingTestimonialsJson || "[]");
      if (testimonials.length >= 2) {
        setTest1Name(testimonials[0]?.name || "");
        setTest1Text(testimonials[0]?.text || "");
        setTest1Stars(testimonials[0]?.stars || 5);
        setTest2Name(testimonials[1]?.name || "");
        setTest2Text(testimonials[1]?.text || "");
        setTest2Stars(testimonials[1]?.stars || 5);
      }
    } catch (error) {
      console.error("Error parsing landingTestimonialsJson:", error);
    }
  }, [business]);

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>, setter: (value: string) => void) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!business) return;
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: business.name,
          category: business.category,
          teamSize: business.teamSize,
          currency: business.currency,
          logoUrl: logoUrl || null,
          landingTitle: landingTitle || null,
          landingSubtitle: landingSubtitle || null,
          landingAbout: landingAbout || null,
          landingCoverUrl: landingCoverUrl || null,
          landingSecondaryCoverUrl: landingSecondaryCoverUrl || null,
          landingPhone: landingPhone || null,
          landingAddress: landingAddress || null,
          landingHours: landingHours || null,
          landingFeaturesJson: JSON.stringify([
            { title: feat1Title, desc: feat1Desc },
            { title: feat2Title, desc: feat2Desc },
            { title: feat3Title, desc: feat3Desc },
          ]),
          landingTestimonialsJson: JSON.stringify([
            { name: test1Name, text: test1Text, stars: test1Stars },
            { name: test2Name, text: test2Text, stars: test2Stars },
          ]),
        }),
      });
      if (!response.ok) {
        alert("Error al guardar cambios de la Landing Page");
        return;
      }
      alert("¡Cambios guardados con éxito en la Landing Page!");
      await onSaved();
    } catch (error) {
      console.error("Error saving landing:", error);
      alert("Error de conexión al guardar cambios");
    } finally {
      setIsSaving(false);
    }
  };

  const state: BrandingFormState = {
    landingTitle, setLandingTitle,
    landingSubtitle, setLandingSubtitle,
    landingAbout, setLandingAbout,
    landingCoverUrl, setLandingCoverUrl,
    landingSecondaryCoverUrl, setLandingSecondaryCoverUrl,
    logoUrl, setLogoUrl,
    landingPhone, setLandingPhone,
    landingAddress, setLandingAddress,
    landingHours, setLandingHours,
    feat1Title, setFeat1Title,
    feat1Desc, setFeat1Desc,
    feat2Title, setFeat2Title,
    feat2Desc, setFeat2Desc,
    feat3Title, setFeat3Title,
    feat3Desc, setFeat3Desc,
    test1Name, setTest1Name,
    test1Text, setTest1Text,
    test1Stars, setTest1Stars,
    test2Name, setTest2Name,
    test2Text, setTest2Text,
    test2Stars, setTest2Stars,
  };

  return { state, isSaving, save, handleImageFileChange };
}
