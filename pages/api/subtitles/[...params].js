// pages/api/subtitles/[...params].js
export default async function handler(req, res) {
  try {
    const { params } = req.query;
    const { serverUrl, apiKey } = req.query;
    
    if (!params || !serverUrl || !apiKey) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Reconstruct the subtitle URL removing existing query parameters
    const subtitlePath = Array.isArray(params) ? params.join('/') : params;
    const cleanedSubtitlePath = subtitlePath.split('?')[0];
    const subtitleUrl = `${serverUrl}/${cleanedSubtitlePath}?api_key=${apiKey}`;
    
    console.log('Received params:', params);
    console.log('Server URL:', serverUrl);
    console.log('API Key:', apiKey ? 'Present' : 'Missing');
    
    console.log('Proxying subtitle request to:', subtitleUrl);
    
    // Fetch the subtitle file from Jellyfin
    const response = await fetch(subtitleUrl);
    
    if (!response.ok) {
      console.error('Failed to fetch subtitle:', response.status, response.statusText);
      return res.status(response.status).json({ error: 'Failed to fetch subtitle' });
    }
    
    const subtitleContent = await response.text();
    
    // Set appropriate headers for WebVTT content
    res.setHeader('Content-Type', 'text/vtt');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    res.status(200).send(subtitleContent);
  } catch (error) {
    console.error('Error proxying subtitle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
