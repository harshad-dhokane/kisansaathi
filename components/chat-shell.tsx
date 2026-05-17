"use client";

import { startTransition, useEffect, useState } from "react";

type UIMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type DeviceCoordinates = {
  latitude: number;
  longitude: number;
};

type LiveContextInput = {
  locationQuery?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  locale?: string;
};

type LiveContextSnapshot = {
  locale: string;
  timezone: string;
  weekday: string;
  date: string;
  time: string;
  locationLabel?: string;
  weatherSummary?: string;
};

function renderFormattedText(content: string) {
  const lines = content.split("\n");

  return lines.map((line, lineIndex) => {
    const parts = line.split(/(\*\*.*?\*\*)/g).filter(Boolean);

    return (
      <span key={`line-${lineIndex}`}>
        {parts.map((part, partIndex) => {
          if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
            return <strong key={`part-${lineIndex}-${partIndex}`}>{part.slice(2, -2)}</strong>;
          }

          return <span key={`part-${lineIndex}-${partIndex}`}>{part}</span>;
        })}
        {lineIndex < lines.length - 1 ? <br /> : null}
      </span>
    );
  });
}

function getBrowserLocale() {
  if (typeof navigator === "undefined") {
    return "en-IN";
  }

  return navigator.language || "en-IN";
}

function getBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function formatClock(locale: string, timezone: string) {
  const now = new Date();

  return {
    weekday: new Intl.DateTimeFormat(locale, {
      weekday: "long",
      timeZone: timezone,
    }).format(now),
    date: new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: timezone,
    }).format(now),
    time: new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timezone,
    }).format(now),
  };
}

function formatCoordinateLabel(latitude: number, longitude: number) {
  return `Current device location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`;
}

export function ChatShell() {
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Ask about crops, irrigation, soil, pests, rainfall, or safe next steps. If you set a location above, I will use it by default for weather-sensitive replies.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [locationDraft, setLocationDraft] = useState("");
  const [selectedContext, setSelectedContext] = useState<LiveContextInput>({
    timezone: getBrowserTimezone(),
    locale: getBrowserLocale(),
  });
  const [contextPreview, setContextPreview] = useState<LiveContextSnapshot | null>(null);
  const [clock, setClock] = useState(() =>
    formatClock(getBrowserLocale(), getBrowserTimezone()),
  );
  const [contextStatus, setContextStatus] = useState(
    "No location selected yet. Add one if you want local weather and place-aware advice by default.",
  );
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isRefreshingContext, setIsRefreshingContext] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOverLimit = draft.length > 2500;
  const canSend = draft.trim().length > 0 && !isLoading && !isOverLimit;

  useEffect(() => {
    const locale = contextPreview?.locale || getBrowserLocale();
    const timezone = contextPreview?.timezone || getBrowserTimezone();

    const updateClock = () => {
      setClock(formatClock(locale, timezone));
    };

    updateClock();
    const intervalId = window.setInterval(updateClock, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [contextPreview?.locale, contextPreview?.timezone]);

  useEffect(() => {
    void refreshContext({
      timezone: getBrowserTimezone(),
      locale: getBrowserLocale(),
    });
  }, []);

  async function refreshContext(nextContext: LiveContextInput, statusMessage?: string) {
    setIsRefreshingContext(true);

    try {
      const response = await fetch("/api/live-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: nextContext }),
      });

      const data = (await response.json()) as LiveContextSnapshot & { error?: string };

      if (!response.ok || typeof data.timezone !== "string") {
        throw new Error(data.error || "Unable to refresh the live context.");
      }

      startTransition(() => {
        setSelectedContext(nextContext);
        setContextPreview(data);
        setIsLocationPickerOpen(false);
        setContextStatus(
          statusMessage ||
            (data.locationLabel
              ? `Using ${data.locationLabel} by default for weather, time, and place-aware farming answers.`
              : "Using your browser time by default. Add a place to make weather-sensitive answers location-aware."),
        );
      });
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Unable to refresh the live context.";
      setContextStatus(message);
    } finally {
      setIsRefreshingContext(false);
    }
  }

  async function applyTypedLocation() {
    const cleaned = locationDraft.trim();

    if (!cleaned) {
      await enableCurrentLocation();
      return;
    }

    await refreshContext(
      {
        locationQuery: cleaned,
        timezone: getBrowserTimezone(),
        locale: getBrowserLocale(),
      },
      `Using ${cleaned} by default for weather, time, and place-aware farming answers.`,
    );
  }

  async function enableCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setContextStatus("This browser does not support device location. Type a place manually.");
      return;
    }

    setIsLocating(true);
    setContextStatus("Checking your current device location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates: DeviceCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        const coordinateLabel = formatCoordinateLabel(
          coordinates.latitude,
          coordinates.longitude,
        );

        void refreshContext(
          {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            timezone: getBrowserTimezone(),
            locale: getBrowserLocale(),
          },
          `Using ${coordinateLabel} by default for weather, time, and place-aware farming answers.`,
        );

        setLocationDraft("");
        setIsLocating(false);
      },
      (geoError) => {
        console.error(geoError);
        setContextStatus(
          "Location access was blocked. You can still type a village, district, city, or country manually.",
        );
        setIsLocating(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000,
      },
    );
  }

  async function sendMessage(content: string) {
    const cleaned = content.trim();
    if (!cleaned) return;

    const nextUserMessage: UIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: cleaned,
    };

    const nextConversation = [...messages, nextUserMessage];
    setMessages(nextConversation);
    setDraft("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextConversation.map(({ role, content: text }) => ({
            role,
            content: text,
          })),
          context: selectedContext,
        }),
      });

      const data = (await response.json()) as {
        reply?: string;
        error?: string;
      };

      if (!response.ok || typeof data.reply !== "string" || data.reply.length === 0) {
        throw new Error(data.error || "Failed to get a reply from the advisory engine.");
      }

      const replyText = data.reply;

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: replyText,
        },
      ]);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong while contacting the chatbot.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  const locationChip = contextPreview?.locationLabel || "No place selected";
  const weatherChip = contextPreview?.weatherSummary
    ? contextPreview.weatherSummary.replace(/^Near [^:]+:\s*/i, "").replace(/\.$/, "")
    : "";
  const headerContextChip =
    weatherChip && contextPreview?.locationLabel
      ? `${locationChip} • ${weatherChip}`
      : contextPreview?.locationLabel || weatherChip || "Set location";

  return (
    <div className="chat-layout chat-layout-single">
      <section className="chat-panel chat-panel-window chat-panel-centered">
        <div className="chat-window">
          <div className="chat-hero">
            <div className="chat-title-row">
              <h1>AgriSmart</h1>
              <div className="chat-title-actions">
                <div className="location-trigger-wrap">
                  <button
                    className="chat-context-trigger"
                    type="button"
                    onClick={() => setIsLocationPickerOpen((current) => !current)}
                    title={headerContextChip}
                  >
                    {headerContextChip}
                  </button>

                  {isLocationPickerOpen ? (
                    <div
                      className="location-popover"
                      role="dialog"
                      aria-modal="false"
                      aria-labelledby="location-modal-title"
                    >
                      <div className="location-modal-header">
                        <div>
                          <p className="section-kicker">Location</p>
                          <h2 id="location-modal-title">Choose weather location</h2>
                        </div>
                        <button
                          className="button button-secondary button-small"
                          type="button"
                          onClick={() => setIsLocationPickerOpen(false)}
                          disabled={isRefreshingContext || isLocating}
                        >
                          Close
                        </button>
                      </div>

                      <label className="sr-only" htmlFor="location-modal-input">
                        Enter a village, district, city, or country
                      </label>
                      <input
                        id="location-modal-input"
                        className="location-input"
                        value={locationDraft}
                        onChange={(event) => setLocationDraft(event.target.value)}
                        placeholder="Type a village, district, city, or country"
                        maxLength={120}
                      />

                      <div className="location-modal-actions">
                        <button
                          className="button button-primary"
                          type="button"
                          onClick={() => void applyTypedLocation()}
                          disabled={isRefreshingContext || isLocating}
                        >
                          {isRefreshingContext ? "Saving..." : "Use typed place"}
                        </button>
                        <button
                          className="button button-secondary"
                          type="button"
                          onClick={() => void enableCurrentLocation()}
                          disabled={isRefreshingContext || isLocating}
                        >
                          {isLocating ? "Locating..." : "Use current location"}
                        </button>
                      </div>

                      <p className="location-modal-status">{contextStatus}</p>
                      <p className="location-modal-current">Current selection: {locationChip}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          <div className="chat-header-divider" />

          <div className="chat-transcript">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`chat-bubble ${
                  message.role === "assistant" ? "chat-bubble-assistant" : "chat-bubble-user"
                }`}
              >
                <p>{renderFormattedText(message.content)}</p>
              </article>
            ))}

            {isLoading ? (
              <article
                className="chat-bubble chat-bubble-assistant chat-bubble-typing"
                aria-live="polite"
                aria-label="AgriSmart is typing"
              >
                <div className="typing-indicator" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="sr-only">AgriSmart is typing</span>
              </article>
            ) : null}
          </div>

          <form
            className="chat-composer"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(draft);
            }}
          >
            <div className="chat-composer-main">
              <label className="sr-only" htmlFor="chat-message">
                Ask a farming question
              </label>
              <input
                id="chat-message"
                type="text"
                className={isOverLimit ? "textarea-invalid" : undefined}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about crops, rainfall, irrigation, pests, soil, or what to do next."
              />
            </div>
            <div className="chat-composer-footer">
              <button className="button button-primary" type="submit" disabled={!canSend}>
                {isLoading ? "Sending..." : "Send"}
              </button>
            </div>
          </form>

          {error ? <p className="error-banner">{error}</p> : null}
        </div>
      </section>
    </div>
  );
}
