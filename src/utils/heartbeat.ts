import fetch from "node-fetch";

const heartbeat = () => {
  const url = process.env.HEARTBEAT_URL as string;

  url !== "https://localhost=9000" &&
    setInterval(async () => {
      try {
        const res = await fetch(url, {
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
      } catch (error) {
        console.log(error);
      }
    }, 2 * 60 * 1000);
};

export default heartbeat;
