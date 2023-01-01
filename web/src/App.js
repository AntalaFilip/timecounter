import React, { useEffect, useState } from "react";
import "./App.css";
import io from "socket.io-client";
import { motion } from "framer-motion";
import useInterval from "./useInterval";
import { DateTime } from "luxon";
import Typography from "@mui/joy/Typography";
import Sheet from "@mui/joy/Sheet";
import Button from "@mui/joy/Button";
import IconButton from "@mui/joy/IconButton";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListSubheader from "@mui/joy/ListSubheader";
import ListItemButton from "@mui/joy/ListItemButton";
import Grid from "@mui/joy/Grid";
import Stack from "@mui/joy/Stack";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import ModalClose from "@mui/joy/ModalClose";
import TextField from "@mui/joy/TextField";
import { Checkbox, Divider, Menu, MenuItem } from "@mui/joy";

const query = Object.fromEntries(
  new URLSearchParams(window.location.search).entries()
);
const uri = query.endpoint ?? undefined;
const socket = io(uri);

function App() {
  const [state, setState] = useState();
  const [refresh, setRefresh] = useState(0);
  const [show, setShow] = useState();
  const [currentTime, setTime] = useState("Loading...");
  const [currentDate, setDate] = useState();
  const [config, setConfig] = useState();
  const [password, setPassword] = useState("");
  const [savePwd, setSavePwd] = useState(false);
  const [modal, setModal] = useState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();
  const [settingsMenu, setSettingsMenu] = useState();
  const [authenticated, setAuthenticated] = useState(false);
  const [newTimeSpeed, setNewTimeSpeed] = useState(1);

  const closeModal = () => {
    setError();
    setModal();
  };

  useEffect(() => {
    socket.emit("counters", (res) => {
      setState(res);
    });
    socket.emit("config", (res) => {
      setConfig(res);
    });
  }, [refresh]);

  useEffect(() => {
    const emitRefresh = () => {
      socket.emit("time", show, (res) => {
        setState(res);
      });
    };

    if (show) {
      emitRefresh();
      socket.emit("subscribe", show, (res) => {});
      socket.on("stateChange", (ctr, meta) => {
        if (ctr !== show) return;
        setState(meta);
      });
      socket.io.on("reconnect", () => emitRefresh());
    }
  }, [show]);

  const changeShow = (ctr) => {
    if (show) {
      socket.emit("unsubscribe", show, (res) => {});
      setPassword("");
      setAuthenticated();
      setLoading(false);
      setError();
      setSavePwd(false);
      setSettingsMenu();
      setState();
      setModal();
    }
    if (ctr) {
      socket.emit("subscribe", ctr, (res) => {});
    }
    setShow(ctr);
  };

  const variants = {
    hidden: {},
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 1,
        staggerChildren: 0.5,
      },
    },
  };

  const children = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.75, ease: "easeInOut" },
    },
  };

  useInterval(() => {
    if (!show || !state?.name) return;

    const realDiff = Math.abs(Date.now() - state.elapsed);
    /** how many TRUE ms since last data update */
    const trueDiff = realDiff * state.speedModifier;
    /** how many TRUE ms passed from start */
    const trueMs = state.running
      ? state.trueElapsed + trueDiff
      : state.trueElapsed;
    /** Current TRUE date, according to startPoint */
    const trueDate = DateTime.fromMillis(trueMs + state.startPoint);
    const timeFmt = query["format"] ?? `HH:mm:ss`;
    const dateFmt = query["dateFormat"] ?? "";

    setTime(trueDate.toUTC().toFormat(timeFmt));
    setDate(trueDate.toUTC().toFormat(dateFmt));
  }, 50);

  const sopts = socket.io.opts;
  console.log(state);

  if (!show) {
    return (
      <Grid sx={{ flexGrow: 1 }} columns={12} container>
        <Grid xs={4} />
        <Grid
          xs={4}
          sx={{
            justifyContent: "center",
            alignItems: "center",
            display: "flex",
          }}
        >
          <Sheet sx={{ borderRadius: "sm", p: "5rem" }}>
            <Typography level="h1" variant="solid">
              TimeCounter
            </Typography>
            <Typography gutterBottom sx={{ mt: 1 }} level="h5">
              {config?.name ?? "..."}
            </Typography>
            <Typography>{config?.motd ?? ""}</Typography>
            <br />
            <List
              variant="outlined"
              sx={{
                bgcolor: "background.body",
                borderRadius: "sm",
                boxShadow: "sm",
              }}
            >
              <ListSubheader
                sx={{ display: "flex", justifyContent: "space-between" }}
              >
                Available counters
                <IconButton
                  sx={{ ml: 2 }}
                  onClick={() => setRefresh(refresh + 1)}
                >
                  <span class="material-symbols-outlined">refresh</span>
                </IconButton>
              </ListSubheader>
              {Array.isArray(state?.counters) ? (
                state.counters.map((ctr) => (
                  <ListItem variant="plain" key={ctr}>
                    <ListItemButton onClick={() => changeShow(ctr)}>
                      {ctr}
                    </ListItemButton>
                  </ListItem>
                ))
              ) : (
                <ListItem>No counters currently available</ListItem>
              )}
            </List>
            <Typography sx={{ mt: 2 }} level="body3">
              <b>{socket.connected ? "Connected to" : "Disconnected from"}:</b>{" "}
              {sopts.hostname}:{sopts.port}
              {sopts.path}
            </Typography>
            <Typography level="body4">
              Made with ❤️ by{" "}
              <a rel="noreferrer" target="_blank" href="https://filip.ahst.sk">
                Filip Antala
              </a>{" "}
              /{" "}
              <a rel="noreferrer" target="_blank" href="https://ahst.sk">
                AntalaHosted
              </a>
            </Typography>
          </Sheet>
        </Grid>
        <Grid xs={4} />
      </Grid>
    );
  } else {
    return (
      <>
        <div className="App">
          <div className="App-header">
            <Sheet variant="soft" sx={{ borderRadius: "sm" }}>
              <Grid container alignItems="center" columns={3}>
                <Grid xs={1} justifyContent="start" display="flex">
                  <Button
                    variant="plain"
                    startDecorator={
                      <span class="material-symbols-outlined">arrow_back</span>
                    }
                    onClick={() => changeShow()}
                  >
                    Back
                  </Button>
                </Grid>
                <Grid xs={1} justifyContent="center" display="flex">
                  <Typography level="h5" style={{ marginLeft: 5 }}>
                    {state.name}
                  </Typography>
                </Grid>
                <Grid xs={1} justifyContent="end" display="flex">
                  <div>
                    <IconButton
                      variant="plain"
                      onClick={(e) => setSettingsMenu(e.currentTarget)}
                    >
                      <span class="material-symbols-outlined">settings</span>
                    </IconButton>
                  </div>
                </Grid>
              </Grid>
            </Sheet>

            <motion.div
              className="App-content"
              variants={variants}
              initial="hidden"
              animate="visible"
            >
              <motion.h2 variants={children}>{currentTime}</motion.h2>
              <motion.h3 variants={children}>{currentDate}</motion.h3>
              <motion.h5
                style={{ color: state.running ? "lime" : "orangered" }}
                variants={children}
              >
                Time is currently {state.running ? `running` : `paused`} at{" "}
                {state.speedModifier}x speed
              </motion.h5>
              <motion.h6
                style={{ color: socket.connected ? "white" : "red" }}
                variants={children}
              >
                {socket.connected ? "Connected to" : "Disconnected from"}{" "}
                TimeCounter services
              </motion.h6>
            </motion.div>
          </div>
        </div>
        <Modal open={modal === "auth"} onClose={() => closeModal()}>
          <ModalDialog>
            <ModalClose />
            <Typography level="h5" mb="0.25rem">
              Authenticate
            </Typography>
            <Typography mb={2}>Enter administrator password:</Typography>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setLoading(true);
                socket.emit("authenticate", show, password, (ack) => {
                  setLoading(false);
                  if (ack === true) {
                    setAuthenticated(true);
                    closeModal();
                  } else if (ack === false) {
                    setAuthenticated(false);
                    setError("Invalid password!");
                  } else {
                    setAuthenticated(false);
                    setError(`An error has occurred`);
                  }
                });
              }}
            >
              <Stack spacing={2}>
                <TextField
                  type="password"
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                  error={Boolean(error)}
                  helperText={error}
                />
                <Checkbox
                  checked={savePwd}
                  onChange={(e) => setSavePwd(e.target.checked)}
                  label="Save password"
                />
                <Button loading={loading} type="submit">
                  Authenticate
                </Button>
              </Stack>
            </form>
          </ModalDialog>
        </Modal>
        <Modal open={modal === "speed"} onClose={() => closeModal()}>
          <ModalDialog>
            <ModalClose />
            <Typography level="h5" mb="0.25rem">
              Time speed
            </Typography>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setLoading(true);
                socket.emit("speed", show, password, newTimeSpeed, (ack) => {
                  setLoading(false);
                  if (ack === true) {
                    closeModal();
                  } else if (ack === false) {
                    setAuthenticated(false);
                    setError("Invalid password!");
                  } else {
                    setAuthenticated(false);
                    setError(`An error has occurred`);
                  }
                });
              }}
            >
              <Stack spacing={2}>
                <TextField
                  type="number"
                  label="New speed"
                  value={newTimeSpeed}
                  onChange={(e) => setNewTimeSpeed(Number(e.target.value))}
                  autoFocus
                  required
                  error={Boolean(error)}
                  helperText={error}
                />
                <Button loading={loading} type="submit">
                  Set speed
                </Button>
              </Stack>
            </form>
          </ModalDialog>
        </Modal>
        <Menu
          size="sm"
          variant="soft"
          open={Boolean(settingsMenu)}
          anchorEl={settingsMenu}
          onClose={() => setSettingsMenu()}
        >
          {authenticated ? (
            <MenuItem
              onClick={() => {
                setPassword("");
                setAuthenticated(false);
                setSettingsMenu();
              }}
              variant="solid"
              color="danger"
            >
              Log out
            </MenuItem>
          ) : (
            <MenuItem
              onClick={() => {
                setModal("auth");
                setSettingsMenu();
              }}
              variant="solid"
              color="primary"
            >
              Authenticate
            </MenuItem>
          )}

          <Divider sx={{ m: 1 }} />
          <MenuItem
            disabled={!authenticated || loading}
            onClick={() => {
              setLoading(true);
              socket.emit("pause", show, password, (ack) => {
                setLoading(false);
                if (ack === true) {
                  setSettingsMenu();
                } else if (ack === false) {
                  setAuthenticated(false);
                  // TODO: show feedback
                } else {
                  setAuthenticated(false);
                  // TODO: show feedback
                }
              });
            }}
          >
            {state.running ? (
              <>
                <span class="material-symbols-outlined">pause</span>&nbsp;Pause
                time
              </>
            ) : (
              <>
                <span class="material-symbols-outlined">play_arrow</span>
                &nbsp;Unpause time
              </>
            )}
          </MenuItem>
          <MenuItem
            disabled={!authenticated || loading}
            onClick={() => {
              setModal("speed");
              setSettingsMenu();
            }}
          >
            <span class="material-symbols-outlined">schedule</span>&nbsp;Change
            time speed
          </MenuItem>
        </Menu>
      </>
    );
  }
}

export default App;
