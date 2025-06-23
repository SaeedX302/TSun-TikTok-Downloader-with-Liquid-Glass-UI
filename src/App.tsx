import React, { useState } from 'react';
import { Download, Music, User, Clock, Copy, Instagram, Github, Twitter, Youtube, MessageCircle, Video } from 'lucide-react';

interface VideoInfo {
  title: string;
  id: string;
  uploader: {
    username: string;
    profilePicture: string;
  };
  music: {
    songName: string;
    artist: string;
  };
  duration: string;
  downloadUrls: {
    noWatermark: string;
    withWatermark: string;
    audioOnly: string;
  };
}

function App() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [showFullTitle, setShowFullTitle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidTikTokUrl = (url: string): boolean => {
    const tikTokRegex = /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com|m\.tiktok\.com)/;
    return tikTokRegex.test(url);
  };

  const getValidProfilePicture = (data: any): string => {
    const possibleUrls = [
      data.data?.author?.avatar_larger,
      data.data?.author?.avatar_medium,
      data.data?.author?.avatar_thumb,
      data.author?.avatar_larger,
      data.author?.avatar_medium,
      data.author?.avatar_thumb,
      data.data?.author?.avatar,
      data.author?.avatar
    ].filter(Boolean);

    return possibleUrls[0] || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=48&h=48&fit=crop';
  };

  const getValidUsername = (data: any): string => {
    const possibleUsernames = [
      data.data?.author?.unique_id,
      data.data?.author?.nickname,
      data.author?.unique_id,
      data.author?.nickname,
      data.data?.author?.username,
      data.author?.username
    ].filter(Boolean);

    const username = possibleUsernames[0] || 'unknown';
    return username.startsWith('@') ? username : `@${username}`;
  };

  const fetchVideoInfo = async () => {
    if (!url.trim()) {
      setError('Please enter a TikTok URL');
      return;
    }

    if (!isValidTikTokUrl(url)) {
      setError('Please enter a valid TikTok URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setVideoInfo(null);

    try {
      const apiUrl = `https://tiktok-video-no-watermark2.p.rapidapi.com/?url=${encodeURIComponent(url)}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': '01bb1dc1e0msh6dee923483c2660p15e32bjsn0a4fd44040bf',
          'X-RapidAPI-Host': 'tiktok-video-no-watermark2.p.rapidapi.com'
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.code !== 0 && data.code !== 200) {
        throw new Error(data.msg || 'Failed to fetch video information');
      }

      const videoData: VideoInfo = {
        title: data.data?.title || data.title || 'TikTok Video',
        id: data.data?.id || data.aweme_id || 'Unknown',
        uploader: {
          username: getValidUsername(data),
          profilePicture: getValidProfilePicture(data)
        },
        music: {
          songName: data.data?.music?.title || data.music?.title || 'Original Sound',
          artist: data.data?.music?.author || data.music?.author || data.data?.author?.nickname || 'TikTok'
        },
        duration: data.data?.duration ? `${Math.floor(data.data.duration / 60)}:${(data.data.duration % 60).toString().padStart(2, '0')}` : 
                 data.duration ? `${Math.floor(data.duration / 60)}:${(data.duration % 60).toString().padStart(2, '0')}` : '0:00',
        downloadUrls: {
          noWatermark: data.data?.hdplay || data.data?.play || data.hdplay || data.play || '',
          withWatermark: data.data?.wmplay || data.wmplay || data.data?.play || data.play || '',
          audioOnly: '' // Audio functionality disabled
        }
      };

      if (!videoData.downloadUrls.noWatermark && !videoData.downloadUrls.withWatermark) {
        throw new Error('No download URLs available for this video');
      }

      setVideoInfo(videoData);
    } catch (err) {
      console.error('❌ Error fetching video info:', err);
      if (err instanceof Error) {
        setError(`Failed to fetch video: ${err.message}`);
      } else {
        setError('Failed to fetch video information. Please check the URL and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (type: 'no-watermark' | 'with-watermark') => {
    if (!videoInfo) {
      setError('Please fetch video information first');
      return;
    }

    let downloadUrl = '';
    let filename = '';

    switch (type) {
      case 'no-watermark':
        downloadUrl = videoInfo.downloadUrls.noWatermark;
        filename = `tsun-${videoInfo.id}-no-watermark.mp4`;
        break;
      case 'with-watermark':
        downloadUrl = videoInfo.downloadUrls.withWatermark;
        filename = `tsun-${videoInfo.id}-with-watermark.mp4`;
        break;
    }

    if (!downloadUrl) {
      setError(`Download URL not available for ${type}. This might be due to API limitations or the video doesn't have this format available.`);
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error('❌ Download error:', err);
      setError('Failed to download. Opening URL in new tab...');
      window.open(downloadUrl, '_blank');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
    }).catch(() => {
      setError('Failed to copy to clipboard');
    });
  };

  const truncateTitle = (title: string, maxLength: number = 75) => {
    if (title.length <= maxLength) return title;
    return showFullTitle ? title : `${title.substring(0, maxLength)}...`;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=48&h=48&fit=crop';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-500/20 to-pink-500/20"></div>
      <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-2xl">
            T<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-blue-400">Sun Studio</span>
          </h1>
          <p className="text-xl text-white/80 font-light">Premium TikTok Video Downloader</p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* URL Input Section */}
          <div className="glass-card p-8 mb-8 rounded-3xl">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError(null);
                  }}
                  placeholder="Paste TikTok URL here..."
                  className="w-full px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent transition-all duration-300"
                />
              </div>
              <button
                onClick={fetchVideoInfo}
                disabled={isLoading}
                className="water-drop-btn px-8 py-4 bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-2xl font-semibold hover:from-pink-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Fetching...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Video className="w-5 h-5" />
                    <span>Download</span>
                  </div>
                )}
              </button>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl">
                <p className="text-red-200 text-sm whitespace-pre-line">{error}</p>
              </div>
            )}
          </div>

          {/* Video Info Section */}
          {videoInfo && (
            <div className="glass-card p-8 mb-8 rounded-3xl animate-fade-in">
              <h3 className="text-2xl font-bold text-white mb-6">Video Information</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Video Details */}
                <div className="space-y-4">
                  <div className="glass-item p-4 rounded-2xl">
                    <h4 className="text-white/80 text-sm font-medium mb-2">Title</h4>
                    <p className="text-white">
                      {truncateTitle(videoInfo.title)}
                      {videoInfo.title.length > 75 && (
                        <button
                          onClick={() => setShowFullTitle(!showFullTitle)}
                          className="ml-2 text-pink-300 hover:text-pink-200 text-sm font-medium transition-colors"
                        >
                          {showFullTitle ? 'Show Less' : 'Show More'}
                        </button>
                      )}
                    </p>
                  </div>

                  <div className="glass-item p-4 rounded-2xl">
                    <h4 className="text-white/80 text-sm font-medium mb-2 flex items-center">
                      <Copy className="w-4 h-4 mr-2" />
                      Video ID
                    </h4>
                    <div className="flex items-center justify-between">
                      <p className="text-white font-mono text-sm">{videoInfo.id}</p>
                      <button
                        onClick={() => copyToClipboard(videoInfo.id)}
                        className="water-drop-btn text-pink-300 hover:text-pink-200 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Uploader & Music Info */}
                <div className="space-y-4">
                  <div className="glass-item p-4 rounded-2xl">
                    <h4 className="text-white/80 text-sm font-medium mb-3 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Uploader
                    </h4>
                    <div className="flex items-center space-x-3">
                      <img
                        src={videoInfo.uploader.profilePicture}
                        alt={videoInfo.uploader.username}
                        className="w-12 h-12 rounded-full border-2 border-white/20 object-cover"
                        onError={handleImageError}
                        loading="lazy"
                      />
                      <span className="text-white font-medium">{videoInfo.uploader.username}</span>
                    </div>
                  </div>

                  <div className="glass-item p-4 rounded-2xl">
                    <h4 className="text-white/80 text-sm font-medium mb-2 flex items-center">
                      <Music className="w-4 h-4 mr-2" />
                      Music
                    </h4>
                    <p className="text-white font-medium">{videoInfo.music.songName}</p>
                    <p className="text-white/70 text-sm">{videoInfo.music.artist}</p>
                  </div>

                  <div className="glass-item p-4 rounded-2xl">
                    <h4 className="text-white/80 text-sm font-medium mb-2 flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Duration
                    </h4>
                    <p className="text-white font-mono text-lg">{videoInfo.duration}</p>
                  </div>
                </div>
              </div>

              {/* Download Options */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <h4 className="text-white text-lg font-semibold mb-4">Download Options</h4>
                <div className="grid sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => handleDownload('no-watermark')}
                    disabled={!videoInfo.downloadUrls.noWatermark}
                    className="water-drop-btn glass-item p-4 rounded-2xl hover:bg-white/20 transition-all duration-300 transform hover:scale-105 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-6 h-6 text-green-400 mx-auto mb-2 group-hover:animate-bounce" />
                    <p className="text-white font-medium">No Watermark</p>
                    <p className="text-white/60 text-sm">HD Quality</p>
                  </button>

                  <button
                    onClick={() => handleDownload('with-watermark')}
                    disabled={!videoInfo.downloadUrls.withWatermark}
                    className="water-drop-btn glass-item p-4 rounded-2xl hover:bg-white/20 transition-all duration-300 transform hover:scale-105 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-6 h-6 text-blue-400 mx-auto mb-2 group-hover:animate-bounce" />
                    <p className="text-white font-medium">With Watermark</p>
                    <p className="text-white/60 text-sm">Original</p>
                  </button>

                  <button
                    disabled={true}
                    className="glass-item p-4 rounded-2xl opacity-50 cursor-not-allowed transition-all duration-300"
                  >
                    <Music className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-white/60 font-medium">Audio Only</p>
                    <p className="text-yellow-300 text-sm font-semibold">Coming Soon...</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Features Section */}
          <div className="glass-card p-8 rounded-3xl">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Why Choose TSun?</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-white font-semibold mb-2">No Watermark</h4>
                <p className="text-white/70 text-sm">Download videos without watermarks in HD quality</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Music className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-white font-semibold mb-2">Audio Extraction</h4>
                <p className="text-white/70 text-sm">Audio download feature coming soon with enhanced quality</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-white font-semibold mb-2">Fast & Secure</h4>
                <p className="text-white/70 text-sm">Lightning-fast downloads with complete privacy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center">
          <div className="glass-card p-6 rounded-3xl mb-6">
            <h4 className="text-white font-semibold mb-4">Connect With Us</h4>
            <div className="flex justify-center space-x-4 flex-wrap">
              <a href="https://github.com/SaeedX302" className="social-link" target="_blank" rel="noopener noreferrer">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://twitter.com/saeedx300" className="social-link" target="_blank" rel="noopener noreferrer">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://instagram.com/saeedxdie" className="social-link" target="_blank" rel="noopener noreferrer">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://t.me/saeedxdie" className="social-link" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="https://tiktok.com/@saeedxdie" className="social-link" target="_blank" rel="noopener noreferrer">
                <Video className="w-5 h-5" />
              </a>
              <a href="https://youtube.com/@TsunMusicOfficial" className="social-link" target="_blank" rel="noopener noreferrer">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
          <p className="text-white/60 text-sm mb-2">
            Designed by <span className="text-pink-300">°【〆༯𝙎ค૯𝙀𝘿】✘【.ISHU.】</span>
          </p>
          <p className="text-white/40 text-xs">
            Won This World - If You Don't Then Go And Die
          </p>
          <p className="text-white/40 text-xs mt-1">
            By -- 〆༯𝙎ค૯𝙀𝘿✘🌹
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
