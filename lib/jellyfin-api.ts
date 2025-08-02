import { requireAuth } from "./apiAuth"

interface creds  {
    token: string;
    userId: string;
}

const getAuth = async () => {
    const auth = await requireAuth()
    const credentials : creds = {
        token: auth.jellyfinToken,
        userId: auth.userId
    }
    return credentials
}

const {token, userId} = await getAuth();

export const jellyfinApi = {
  getPlaybackInfo: async (itemId: string, serverUrl: string) => {
    const response = await fetch(
      `${serverUrl}/Items/${itemId}/PlaybackInfo?UserId=${userId}`,
      {
        method: 'POST',
        headers: {
            'Authorization': `MediaBrowser Token="${token}"`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          DeviceProfile: {
            MaxStreamingBitrate: 120000000,
            EnableDirectPlay: true,
            EnableDirectStream: true,
            EnableTranscoding: true,
          },
        }),
      }
    );
    return response.json();
  },

  getItemDetails: async (itemId: string, serverUrl: string) => {
    const response = await fetch(
      `${serverUrl}/Users/${userId}/Items/${itemId}`,
      { headers: {
        'Authorization': `MediaBrowser Token="${token}"`,
        'Content-Type': 'application/json',
      } }
    );
    return response.json();
  },
};