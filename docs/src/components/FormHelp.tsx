import { useEffect } from "react";
import { guidme as guide } from "guidme";
import "guidme/dist/guidme.css";

export function FormHelp() {
  useEffect(() => {
    const guidme = guide({
      popoverClass: "guidme-theme",
      stagePadding: 0,
      onDestroyed: () => {
        (document?.activeElement as any)?.blur();
      }
    });

    const nameEl = document.getElementById("name");
    const educationEl = document.getElementById("education");
    const ageEl = document.getElementById("age");
    const addressEl = document.getElementById("address");
    const submitEl = document.getElementById("submit-btn");

    nameEl!.addEventListener("focus", () => {
      guidme.highlight({
        element: nameEl!,
        popover: {
          title: "Name",
          description: "Enter your name here",
        },
      });
    });

    educationEl!.addEventListener("focus", () => {
      guidme.highlight({
        element: educationEl!,
        popover: {
          title: "Education",
          description: "Enter your education here",
        },
      });
    });

    ageEl!.addEventListener("focus", () => {
      guidme.highlight({
        element: ageEl!,
        popover: {
          title: "Age",
          description: "Enter your age here",
        },
      });
    });

    addressEl!.addEventListener("focus", () => {
      guidme.highlight({
        element: addressEl!,
        popover: {
          title: "Address",
          description: "Enter your address here",
        },
      });
    });

    submitEl!.addEventListener("focus", (e) => {
      e.preventDefault();
      guidme.destroy();
    });
  });

  return <></>;
}
