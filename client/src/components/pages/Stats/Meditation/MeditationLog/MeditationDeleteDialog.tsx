import { Dialog, Button } from "eri";
import { useDispatch } from "react-redux";
import eventsSlice from "../../../../../store/eventsSlice";
import { dateTimeFormatter } from "../../../../../dateTimeFormatters";

interface Props {
  id: string | undefined;
  open: boolean;
  onClose(): void;
}

export default function MeditationDeleteDialog({ id, onClose, open }: Props) {
  const dispatch = useDispatch();

  return (
    <Dialog onClose={onClose} open={open} title="Delete log?">
      {id && <p>{dateTimeFormatter.format(new Date(id))}</p>}
      <Button.Group>
        <Button
          danger
          onClick={() => {
            if (!id) {
              // eslint-disable-next-line no-console
              console.error(
                "Dialog button was pressed while dialog was closed"
              );
              return;
            }
            dispatch(
              eventsSlice.actions.add({
                type: "v1/meditations/delete",
                createdAt: new Date().toISOString(),
                payload: id,
              })
            );
            onClose();
          }}
        >
          Delete
        </Button>
        <Button onClick={onClose} variant="secondary">
          Cancel
        </Button>
      </Button.Group>
    </Dialog>
  );
}
