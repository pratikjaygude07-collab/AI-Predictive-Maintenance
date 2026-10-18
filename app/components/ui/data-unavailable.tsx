import { DataUnavailable as DataUnavailableState } from "./data-state";

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
    <DataUnavailableState title={title} message={message} detail={detail} />
  );
}
