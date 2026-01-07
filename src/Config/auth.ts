export async function getAccessToken() {
  const params = new URLSearchParams({
    client_id: (import.meta as any).env.VITE_TWITCH_CLIENT_ID,
    client_secret: (import.meta as any).env.VITE_TWITCH_CLIENT_SECRET,
    grant_type: "client_credentials"
  });

  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?${params.toString()}`,
    { method: "POST" }
  );

  const data = await response.json();
  console.log(data.access_token);
  
  return data.access_token;
}