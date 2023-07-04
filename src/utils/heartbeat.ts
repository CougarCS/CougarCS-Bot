import fetch from "node-fetch";

const heartbeat = () => {
  setInterval(async () => {
    const res = await fetch(process.env.HEARTBEAT_URL as string, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "alive",
      }),
    });

    if (res.status !== 200) {
      return;
    }
  }, 2 * 60 * 1000);
};

export default heartbeat;
