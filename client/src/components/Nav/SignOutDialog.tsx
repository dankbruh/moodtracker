import { Dialog, Button } from "eri";
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { userPool } from "../../cognito";
import { TEST_IDS } from "../../constants";
import { eventsSelector } from "../../selectors";
import { slicesToClearOnLogout } from "../../store";

interface Props {
  onClose(): void;
  open: boolean;
}

export default function SignOutDialog({ onClose, open }: Props) {
  const events = useSelector(eventsSelector);
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSignOut = () => {
    setIsLoading(true);
    const currentUser = userPool.getCurrentUser();
    if (currentUser) currentUser.signOut();
    onClose();
    for (const slice of slicesToClearOnLogout) dispatch(slice.actions.clear());
    setIsLoading(false);
  };

  return (
    <Dialog
      disableClose={isLoading}
      onClose={onClose}
      open={open}
      title="Sign out?"
    >
      {events.idsToSync.length ? (
        <p>
          <strong>
            WARNING: some of your data has not yet been synced to the server and
            will be lost if you sign out now. If you don&apos;t want to lose any
            data please connect to the internet to sync before logging out.
          </strong>
        </p>
      ) : (
        <p>Safe to sign out, all data is synced to the server.</p>
      )}
      <Button.Group>
        <Button
          danger
          data-test-id={TEST_IDS.signOutConfirmButton}
          disabled={isLoading}
          onClick={handleSignOut}
        >
          Sign out
        </Button>
        <Button disabled={isLoading} onClick={onClose} variant="secondary">
          Cancel
        </Button>
      </Button.Group>
    </Dialog>
  );
}
