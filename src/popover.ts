import { bringInView, getFocusableElements } from "./utils";
import { Config, GuidmeHook, getConfig } from "./config";
import { getState, setState, State } from "./state";
import { GuidmeStep } from "./guidme";
import { onGuidmeClick } from "./events";
import { emit } from "./emitter";

export type Side = "top" | "right" | "bottom" | "left" | "over";
export type Alignment = "start" | "center" | "end";
export type AllowedButtons = "next" | "previous" | "close";

export type Popover = {
  title?: string;
  description?: string;
  side?: Side;
  align?: Alignment;

  showButtons?: AllowedButtons[];
  showProgress?: boolean;
  disableButtons?: AllowedButtons[];

  popoverClass?: string;

  // Button texts
  progressText?: string;
  doneBtnText?: string;
  nextBtnText?: string;
  prevBtnText?: string;

  // Called after the popover is rendered
  onPopoverRender?: (popover: PopoverDOM, opts: { config: Config; state: State }) => void;

  // Button callbacks
  onNextClick?: GuidmeHook;
  onPrevClick?: GuidmeHook;
  onCloseClick?: GuidmeHook;
};

export type PopoverDOM = {
  wrapper: HTMLElement;
  arrow: HTMLElement;
  title: HTMLElement;
  description: HTMLElement;
  footer: HTMLElement;
  progress: HTMLElement;
  previousButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  closeButton: HTMLButtonElement;
  footerButtons: HTMLElement;
};

export function hidePopover() {
  const popover = getState("popover");
  if (!popover) {
    return;
  }

  popover.wrapper.style.display = "none";
}

export function renderPopover(element: Element, step: GuidmeStep) {
  let popover = getState("popover");
  if (popover) {
    document.body.removeChild(popover.wrapper);
  }

  popover = createPopover();
  document.body.appendChild(popover.wrapper);

  const {
    title,
    description,
    showButtons,
    disableButtons,
    showProgress,

    nextBtnText = getConfig("nextBtnText") || "Next &rarr;",
    prevBtnText = getConfig("prevBtnText") || "&larr; Previous",
    progressText = getConfig("progressText") || "{current} of {total}",
  } = step.popover || {};

  popover.nextButton.innerHTML = nextBtnText;
  popover.previousButton.innerHTML = prevBtnText;
  popover.progress.innerHTML = progressText;

  if (title) {
    popover.title.innerHTML = title;
    popover.title.style.display = "block";
  } else {
    popover.title.style.display = "none";
  }

  if (description) {
    popover.description.innerHTML = description;
    popover.description.style.display = "block";
  } else {
    popover.description.style.display = "none";
  }

  const showButtonsConfig: AllowedButtons[] = showButtons || getConfig("showButtons")!;
  const showProgressConfig = showProgress || getConfig("showProgress") || false;
  const showFooter =
    showButtonsConfig?.includes("next") || showButtonsConfig?.includes("previous") || showProgressConfig;

  popover.closeButton.style.display = showButtonsConfig.includes("close") ? "block" : "none";

  if (showFooter) {
    popover.footer.style.display = "flex";

    popover.progress.style.display = showProgressConfig ? "block" : "none";
    popover.nextButton.style.display = showButtonsConfig.includes("next") ? "block" : "none";
    popover.previousButton.style.display = showButtonsConfig.includes("previous") ? "block" : "none";
  } else {
    popover.footer.style.display = "none";
  }

  const disabledButtonsConfig: AllowedButtons[] = disableButtons || getConfig("disableButtons")! || [];
  if (disabledButtonsConfig?.includes("next")) {
    popover.nextButton.disabled = true;
    popover.nextButton.classList.add("guidme-popover-btn-disabled");
  }

  if (disabledButtonsConfig?.includes("previous")) {
    popover.previousButton.disabled = true;
    popover.previousButton.classList.add("guidme-popover-btn-disabled");
  }

  if (disabledButtonsConfig?.includes("close")) {
    popover.closeButton.disabled = true;
    popover.closeButton.classList.add("guidme-popover-btn-disabled");
  }

  // Reset the popover position
  const popoverWrapper = popover.wrapper;
  popoverWrapper.style.display = "block";
  popoverWrapper.style.left = "";
  popoverWrapper.style.top = "";
  popoverWrapper.style.bottom = "";
  popoverWrapper.style.right = "";

  popoverWrapper.id = "guidme-popover-content";
  popoverWrapper.setAttribute("role", "dialog");
  popoverWrapper.setAttribute("aria-labelledby", "guidme-popover-title");
  popoverWrapper.setAttribute("aria-describedby", "guidme-popover-description");

  // Reset the classes responsible for the arrow position
  const popoverArrow = popover.arrow;
  popoverArrow.className = "guidme-popover-arrow";

  // Reset any custom classes on the popover
  const customPopoverClass = step.popover?.popoverClass || getConfig("popoverClass") || "";
  popoverWrapper.className = `guidme-popover ${customPopoverClass}`.trim();

  // Handles the popover button clicks
  onGuidmeClick(
    popover.wrapper,
    e => {
      const target = e.target as HTMLElement;

      const onNextClick = step.popover?.onNextClick || getConfig("onNextClick");
      const onPrevClick = step.popover?.onPrevClick || getConfig("onPrevClick");
      const onCloseClick = step.popover?.onCloseClick || getConfig("onCloseClick");

      if (target.classList.contains("guidme-popover-next-btn")) {
        // If the user has provided a custom callback, call it
        // otherwise, emit the event.
        if (onNextClick) {
          return onNextClick(element, step, {
            config: getConfig(),
            state: getState(),
          });
        } else {
          return emit("nextClick");
        }
      }

      if (target.classList.contains("guidme-popover-prev-btn")) {
        if (onPrevClick) {
          return onPrevClick(element, step, {
            config: getConfig(),
            state: getState(),
          });
        } else {
          return emit("prevClick");
        }
      }

      if (target.classList.contains("guidme-popover-close-btn")) {
        if (onCloseClick) {
          return onCloseClick(element, step, {
            config: getConfig(),
            state: getState(),
          });
        } else {
          return emit("closeClick");
        }
      }

      return undefined;
    },
    target => {
      // Only prevent the default action if we're clicking on a guidme button
      // This allows us to have links inside the popover title and description
      return (
        !popover?.description.contains(target) &&
        !popover?.title.contains(target) &&
        typeof target.className === 'string' &&
        target.className.includes("guidme-popover")
      );
    }
  );

  setState("popover", popover);

  const onPopoverRender = step.popover?.onPopoverRender || getConfig("onPopoverRender");
  if (onPopoverRender) {
    onPopoverRender(popover, {
      config: getConfig(),
      state: getState(),
    });
  }

  repositionPopover(element, step);
  bringInView(popoverWrapper);

  // Focus on the first focusable element in active element or popover
  const isToDummyElement = element.classList.contains("guidme-dummy-element");
  const focusableElement = getFocusableElements([popoverWrapper, ...(isToDummyElement ? [] : [element])]);
  if (focusableElement.length > 0) {
    focusableElement[0].focus();
  }
}

type PopoverDimensions = {
  width: number;
  height: number;
  realWidth: number;
  realHeight: number;
};

function getPopoverDimensions(): PopoverDimensions | undefined {
  const popover = getState("popover");
  if (!popover?.wrapper) {
    return;
  }

  const boundingClientRect = popover.wrapper.getBoundingClientRect();

  const stagePadding = getConfig("stagePadding") || 0;
  const popoverOffset = getConfig("popoverOffset") || 0;

  return {
    width: boundingClientRect.width + stagePadding + popoverOffset,
    height: boundingClientRect.height + stagePadding + popoverOffset,

    realWidth: boundingClientRect.width,
    realHeight: boundingClientRect.height,
  };
}

function calculateTopForLeftRight(
  alignment: Alignment,
  config: {
    elementDimensions: DOMRect;
    popoverDimensions: PopoverDimensions;
    popoverPadding: number;
    popoverArrowDimensions: { width: number; height: number };
  }
): number {
  const { elementDimensions, popoverDimensions, popoverPadding, popoverArrowDimensions } = config;

  if (alignment === "start") {
    return Math.max(
      Math.min(
        elementDimensions.top - popoverPadding,
        window.innerHeight - popoverDimensions!.realHeight - popoverArrowDimensions.width
      ),
      popoverArrowDimensions.width
    );
  }

  if (alignment === "end") {
    return Math.max(
      Math.min(
        elementDimensions.top - popoverDimensions?.realHeight + elementDimensions.height + popoverPadding,
        window.innerHeight - popoverDimensions?.realHeight - popoverArrowDimensions.width
      ),
      popoverArrowDimensions.width
    );
  }

  if (alignment === "center") {
    return Math.max(
      Math.min(
        elementDimensions.top + elementDimensions.height / 2 - popoverDimensions?.realHeight / 2,
        window.innerHeight - popoverDimensions?.realHeight - popoverArrowDimensions.width
      ),
      popoverArrowDimensions.width
    );
  }

  return 0;
}

// Calculate the left placement for top and bottom sides
function calculateLeftForTopBottom(
  alignment: Alignment,
  config: {
    elementDimensions: DOMRect;
    popoverDimensions: PopoverDimensions;
    popoverPadding: number;
    popoverArrowDimensions: { width: number; height: number };
  }
): number {
  const { elementDimensions, popoverDimensions, popoverPadding, popoverArrowDimensions } = config;

  if (alignment === "start") {
    return Math.max(
      Math.min(
        elementDimensions.left - popoverPadding,
        window.innerWidth - popoverDimensions!.realWidth - popoverArrowDimensions.width
      ),
      popoverArrowDimensions.width
    );
  }

  if (alignment === "end") {
    return Math.max(
      Math.min(
        elementDimensions.left - popoverDimensions?.realWidth + elementDimensions.width + popoverPadding,
        window.innerWidth - popoverDimensions?.realWidth - popoverArrowDimensions.width
      ),
      popoverArrowDimensions.width
    );
  }

  if (alignment === "center") {
    return Math.max(
      Math.min(
        elementDimensions.left + elementDimensions.width / 2 - popoverDimensions?.realWidth / 2,
        window.innerWidth - popoverDimensions?.realWidth - popoverArrowDimensions.width
      ),
      popoverArrowDimensions.width
    );
  }

  return 0;
}

export function repositionPopover(element: Element, step: GuidmeStep) {
  const popover = getState("popover");
  if (!popover) {
    return;
  }

  const { align = "start", side = "left" } = step?.popover || {};

  // Configure the popover positioning
  const requiredAlignment: Alignment = align;
  const requiredSide: Side = element.id === "guidme-dummy-element" ? "over" : side;
  const popoverPadding = getConfig("stagePadding") || 0;

  const popoverDimensions = getPopoverDimensions()!;
  const popoverArrowDimensions = popover.arrow.getBoundingClientRect();
  const elementDimensions = element.getBoundingClientRect();

  const topValue = elementDimensions.top - popoverDimensions!.height;
  let isTopOptimal = topValue >= 0;

  const bottomValue = window.innerHeight - (elementDimensions.bottom + popoverDimensions!.height);
  let isBottomOptimal = bottomValue >= 0;

  const leftValue = elementDimensions.left - popoverDimensions!.width;
  let isLeftOptimal = leftValue >= 0;

  const rightValue = window.innerWidth - (elementDimensions.right + popoverDimensions!.width);
  let isRightOptimal = rightValue >= 0;

  const noneOptimal = !isTopOptimal && !isBottomOptimal && !isLeftOptimal && !isRightOptimal;
  let popoverRenderedSide: Side = requiredSide;

  if (requiredSide === "top" && isTopOptimal) {
    isRightOptimal = isLeftOptimal = isBottomOptimal = false;
  } else if (requiredSide === "bottom" && isBottomOptimal) {
    isRightOptimal = isLeftOptimal = isTopOptimal = false;
  } else if (requiredSide === "left" && isLeftOptimal) {
    isRightOptimal = isTopOptimal = isBottomOptimal = false;
  } else if (requiredSide === "right" && isRightOptimal) {
    isLeftOptimal = isTopOptimal = isBottomOptimal = false;
  }

  if (requiredSide === "over") {
    const leftToSet = window.innerWidth / 2 - popoverDimensions!.realWidth / 2;
    const topToSet = window.innerHeight / 2 - popoverDimensions!.realHeight / 2;

    popover.wrapper.style.left = `${leftToSet}px`;
    popover.wrapper.style.right = `auto`;
    popover.wrapper.style.top = `${topToSet}px`;
    popover.wrapper.style.bottom = `auto`;
  } else if (noneOptimal) {
    const leftValue = window.innerWidth / 2 - popoverDimensions?.realWidth! / 2;
    const bottomValue = 10;

    popover.wrapper.style.left = `${leftValue}px`;
    popover.wrapper.style.right = `auto`;
    popover.wrapper.style.bottom = `${bottomValue}px`;
    popover.wrapper.style.top = `auto`;
  } else if (isLeftOptimal) {
    const leftToSet = Math.min(
      leftValue,
      window.innerWidth - popoverDimensions?.realWidth - popoverArrowDimensions.width
    );

    const topToSet = calculateTopForLeftRight(requiredAlignment, {
      elementDimensions,
      popoverDimensions,
      popoverPadding,
      popoverArrowDimensions,
    });

    popover.wrapper.style.left = `${leftToSet}px`;
    popover.wrapper.style.top = `${topToSet}px`;
    popover.wrapper.style.bottom = `auto`;
    popover.wrapper.style.right = "auto";

    popoverRenderedSide = "left";
  } else if (isRightOptimal) {
    const rightToSet = Math.min(
      rightValue,
      window.innerWidth - popoverDimensions?.realWidth - popoverArrowDimensions.width
    );
    const topToSet = calculateTopForLeftRight(requiredAlignment, {
      elementDimensions,
      popoverDimensions,
      popoverPadding,
      popoverArrowDimensions,
    });

    popover.wrapper.style.right = `${rightToSet}px`;
    popover.wrapper.style.top = `${topToSet}px`;
    popover.wrapper.style.bottom = `auto`;
    popover.wrapper.style.left = "auto";

    popoverRenderedSide = "right";
  } else if (isTopOptimal) {
    const topToSet = Math.min(
      topValue,
      window.innerHeight - popoverDimensions!.realHeight - popoverArrowDimensions.width
    );
    let leftToSet = calculateLeftForTopBottom(requiredAlignment, {
      elementDimensions,
      popoverDimensions,
      popoverPadding,
      popoverArrowDimensions,
    });

    popover.wrapper.style.top = `${topToSet}px`;
    popover.wrapper.style.left = `${leftToSet}px`;
    popover.wrapper.style.bottom = `auto`;
    popover.wrapper.style.right = "auto";

    popoverRenderedSide = "top";
  } else if (isBottomOptimal) {
    const bottomToSet = Math.min(
      bottomValue,
      window.innerHeight - popoverDimensions?.realHeight - popoverArrowDimensions.width
    );

    let leftToSet = calculateLeftForTopBottom(requiredAlignment, {
      elementDimensions,
      popoverDimensions,
      popoverPadding,
      popoverArrowDimensions,
    });

    popover.wrapper.style.left = `${leftToSet}px`;
    popover.wrapper.style.bottom = `${bottomToSet}px`;
    popover.wrapper.style.top = `auto`;
    popover.wrapper.style.right = "auto";

    popoverRenderedSide = "bottom";
  }

  // Popover stays on the screen if the element scrolls out of the visible area.
  // Render the arrow again to make sure it's in the correct position
  // e.g. if element scrolled out of the screen to the top, the arrow should be rendered
  // pointing to the top. If the element scrolled out of the screen to the bottom,
  // the arrow should be rendered pointing to the bottom.
  if (!noneOptimal) {
    renderPopoverArrow(requiredAlignment, popoverRenderedSide, element);
  } else {
    popover.arrow.classList.add("guidme-popover-arrow-none");
  }
}

function renderPopoverArrow(alignment: Alignment, side: Side, element: Element) {
  const popover = getState("popover");
  if (!popover) {
    return;
  }

  const elementDimensions = element.getBoundingClientRect();
  const popoverDimensions = getPopoverDimensions()!;
  const popoverArrow = popover.arrow;

  const popoverWidth = popoverDimensions.width;
  const windowWidth = window.innerWidth;
  const elementWidth = elementDimensions.width;
  const elementLeft = elementDimensions.left;

  const popoverHeight = popoverDimensions.height;
  const windowHeight = window.innerHeight;
  const elementTop = elementDimensions.top;
  const elementHeight = elementDimensions.height;

  // Remove all arrow classes
  popoverArrow.className = "guidme-popover-arrow";

  let arrowSide = side;
  let arrowAlignment = alignment;

  if (side === "top") {
    if (elementLeft + elementWidth <= 0) {
      arrowSide = "right";
      arrowAlignment = "end";
    } else if (elementLeft + elementWidth - popoverWidth <= 0) {
      arrowSide = "top";
      arrowAlignment = "start";
    }
    if (elementLeft >= windowWidth) {
      arrowSide = "left";
      arrowAlignment = "end";
    } else if (elementLeft + popoverWidth >= windowWidth) {
      arrowSide = "top";
      arrowAlignment = "end";
    }
  } else if (side === "bottom") {
    if (elementLeft + elementWidth <= 0) {
      arrowSide = "right";
      arrowAlignment = "start";
    } else if (elementLeft + elementWidth - popoverWidth <= 0) {
      arrowSide = "bottom";
      arrowAlignment = "start";
    }
    if (elementLeft >= windowWidth) {
      arrowSide = "left";
      arrowAlignment = "start";
    } else if (elementLeft + popoverWidth >= windowWidth) {
      arrowSide = "bottom";
      arrowAlignment = "end";
    }
  } else if (side === "left") {
    if (elementTop + elementHeight <= 0) {
      arrowSide = "bottom";
      arrowAlignment = "end";
    } else if (elementTop + elementHeight - popoverHeight <= 0) {
      arrowSide = "left";
      arrowAlignment = "start";
    }

    if (elementTop >= windowHeight) {
      arrowSide = "top";
      arrowAlignment = "end";
    } else if (elementTop + popoverHeight >= windowHeight) {
      arrowSide = "left";
      arrowAlignment = "end";
    }
  } else if (side === "right") {
    if (elementTop + elementHeight <= 0) {
      arrowSide = "bottom";
      arrowAlignment = "start";
    } else if (elementTop + elementHeight - popoverHeight <= 0) {
      arrowSide = "right";
      arrowAlignment = "start";
    }

    if (elementTop >= windowHeight) {
      arrowSide = "top";
      arrowAlignment = "start";
    } else if (elementTop + popoverHeight >= windowHeight) {
      arrowSide = "right";
      arrowAlignment = "end";
    }
  } else {
  }

  if (!arrowSide) {
    popoverArrow.classList.add("guidme-popover-arrow-none");
  } else {
    popoverArrow.classList.add(`guidme-popover-arrow-side-${arrowSide}`);
    popoverArrow.classList.add(`guidme-popover-arrow-align-${arrowAlignment}`);
  }
}

function createPopover(): PopoverDOM {
  const wrapper = document.createElement("div");
  wrapper.classList.add("guidme-popover");

  const arrow = document.createElement("div");
  arrow.classList.add("guidme-popover-arrow");

  const title = document.createElement("header");
  title.id = "guidme-popover-title";
  title.classList.add("guidme-popover-title");
  title.style.display = "none";
  title.innerText = "Popover Title";

  const description = document.createElement("div");
  description.id = "guidme-popover-description";
  description.classList.add("guidme-popover-description");
  description.style.display = "none";
  description.innerText = "Popover description is here";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.classList.add("guidme-popover-close-btn");
  closeButton.setAttribute("aria-label", "Close");
  closeButton.innerHTML = "&times;";

  const footer = document.createElement("footer");
  footer.classList.add("guidme-popover-footer");

  const progress = document.createElement("span");
  progress.classList.add("guidme-popover-progress-text");
  progress.innerText = "";

  const footerButtons = document.createElement("span");
  footerButtons.classList.add("guidme-popover-navigation-btns");

  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.classList.add("guidme-popover-prev-btn");
  previousButton.innerHTML = "&larr; Previous";

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.classList.add("guidme-popover-next-btn");
  nextButton.innerHTML = "Next &rarr;";

  footerButtons.appendChild(previousButton);
  footerButtons.appendChild(nextButton);
  footer.appendChild(progress);
  footer.appendChild(footerButtons);

  wrapper.appendChild(closeButton);
  wrapper.appendChild(arrow);
  wrapper.appendChild(title);
  wrapper.appendChild(description);
  wrapper.appendChild(footer);

  return {
    wrapper,
    arrow,
    title,
    description,
    footer,
    previousButton,
    nextButton,
    closeButton,
    footerButtons,
    progress,
  };
}

export function destroyPopover() {
  const popover = getState("popover");
  if (!popover) {
    return;
  }

  popover.wrapper.parentElement?.removeChild(popover.wrapper);
}
