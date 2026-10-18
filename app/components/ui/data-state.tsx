import {
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  ServerOff,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge, Button } from "./primitives";

type DataStateProps =
  | {
      status: "loading";
      title: string;
      message: string;
    }
  | {
      status: "empty";
      title: string;
      message: string;
      actionLabel?: string;
      onAction?: () => void;
    }
  | {
      status: "error";
      title: string;
      message: string;
      detail?: string;
      actionLabel?: string;
      onAction?: () => void;
    }
  | {
      status: "unavailable";
      title: string;
      message: string;
      detail: string;
    };

const statusContent: Record<
  DataStateProps["status"],
  {
    icon: typeof CircleAlert;
    label: string;
    tone: "neutral" | "cyan" | "green" | "amber" | "red";
  }
> = {
  loading: { icon: LoaderCircle, label: "LOADING", tone: "cyan" },
  empty: { icon: CircleCheck, label: "NO RECORDS", tone: "neutral" },
  error: { icon: CircleAlert, label: "REQUEST FAILED", tone: "red" },
  unavailable: { icon: ServerOff, label: "API UNAVAILABLE", tone: "amber" },
};

export function DataState(props: DataStateProps) {
  const content = statusContent[props.status];
  const Icon = content.icon;
  const isError = props.status === "error";
  const isLoading = props.status === "loading";
  const details = "detail" in props ? props.detail : undefined;
  const actionLabel = "actionLabel" in props ? props.actionLabel : undefined;
  const onAction = "onAction" in props ? props.onAction : undefined;
  const icon: ReactNode = (
    <Icon
      className={isLoading ? "data-state-spinner" : undefined}
      size={19}
      aria-hidden="true"
    />
  );

  return (
    <section
      className={`ui-card data-state data-state-${props.status}`}
      role={isError ? "alert" : "status"}
      aria-busy={isLoading || undefined}
    >
      <span className="data-state-icon">{icon}</span>
      <div className="data-state-copy">
        <div className="data-state-heading">
          <h2>{props.title}</h2>
          <Badge tone={content.tone}>{content.label}</Badge>
        </div>
        <p>{props.message}</p>
        {details && <small>{details}</small>}
        {actionLabel && onAction && (
          <Button
            className="data-state-action"
            onClick={onAction}
            variant="secondary"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </section>
  );
}

export function DataEmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <DataState
      status="empty"
      title={title}
      message={message}
      actionLabel={actionLabel}
      onAction={onAction}
    />
  );
}

export function DataUnavailable({
  title,
  message,
  detail,
}: {
  title: string;
  message: string;
  detail: string;
}) {
  return (
    <DataState
      status="unavailable"
      title={title}
      message={message}
      detail={detail}
    />
  );
}
