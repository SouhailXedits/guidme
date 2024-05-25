import type { Config, GuidmeStep, PopoverDOM } from "guidme";
import { guidme as guid } from "guidme";
import "guidme/dist/guidme.css";

type CodeSampleProps = {
  heading?: string;

  config?: Config;
  highlight?: GuidmeStep;
  tour?: GuidmeStep[];

  id?: string;
  className?: string;
  children?: any;
  buttonText?: string;
};

export function removeDummyElement() {
  const el = document.querySelector(".dynamic-el");
  if (el) {
    el.remove();
  }
}

export function mountDummyElement() {
  const newDiv = (document.querySelector(".dynamic-el") || document.createElement("div")) as HTMLElement;

  newDiv.innerHTML = "This is a new Element";
  newDiv.style.display = "block";
  newDiv.style.padding = "20px";
  newDiv.style.backgroundColor = "black";
  newDiv.style.color = "white";
  newDiv.style.fontSize = "14px";
  newDiv.style.position = "fixed";
  newDiv.style.top = `${Math.random() * (500 - 30) + 30}px`;
  newDiv.style.left = `${Math.random() * (500 - 30) + 30}px`;
  newDiv.className = "dynamic-el";

  document.body.appendChild(newDiv);
}

function attachFirstButton(popover: PopoverDOM) {
  const firstButton = document.createElement("button");
  firstButton.innerText = "Go to First";
  popover.footerButtons.appendChild(firstButton);

  firstButton.addEventListener("click", () => {
    window.guidmeObj.drive(0);
  });
}

export function CodeSample(props: CodeSampleProps) {
  const { heading, id, children, buttonText = "Show me an Example", className, config, highlight, tour } = props;

  if (id === "demo-hook-theme") {
    config!.onPopoverRender = attachFirstButton;
  }

  function onClick() {
    if (highlight) {
      const guidme = guid({
        ...config,
      });

      window.guidmeObj = guidme;
      guidme.highlight(highlight);
    } else if (tour) {
      if (id === "confirm-destroy") {
        config!.onDestroyStarted = () => {
          if (!guidme.hasNextStep() || confirm("Are you sure?")) {
            guidme.destroy();
          }
        };
      }

      if (id === "logger-events") {
        config!.onNextClick = () => {
          console.log("next clicked");
        };

        config!.onNextClick = () => {
          console.log("Next Button Clicked");
          // Implement your own functionality here
          guidme.moveNext();
        };
        config!.onPrevClick = () => {
          console.log("Previous Button Clicked");
          // Implement your own functionality here
          guidme.movePrevious();
        };
        config!.onCloseClick = () => {
          console.log("Close Button Clicked");
          // Implement your own functionality here
          guidme.destroy();
        };
      }

      if (tour?.[2]?.popover?.title === "Next Step is Async") {
        tour[2].popover.onNextClick = () => {
          mountDummyElement();
          guidme.moveNext();
        };

        if (tour?.[3]?.element === ".dynamic-el") {
          tour[3].onDeselected = () => {
            removeDummyElement();
          };

          // @ts-ignore
          tour[4].popover.onPrevClick = () => {
            mountDummyElement();
            guidme.movePrevious();
          };

          // @ts-ignore
          tour[3].popover.onPrevClick = () => {
            removeDummyElement();
            guidme.movePrevious();
          };
        }
      }

      const guidme = guid({
        ...config,
        steps: tour,
      });

      window.guidmeObj = guidme;
      guidme.drive();
    }
  }

  return (
    <div id={id} className={className}>
      {heading && <p className="text-lg -mt-0 font-medium text-black -mb-3 rounded-md">{heading}</p>}
      {children && <div className="-mb-4">{children}</div>}
      <button onClick={onClick} className="w-full rounded-md bg-black p-2 text-white">
        {buttonText}
      </button>
    </div>
  );
}
