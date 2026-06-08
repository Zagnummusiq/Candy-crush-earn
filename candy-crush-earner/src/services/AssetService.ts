import axios from 'axios';

interface SeasonalConfig {
  theme: string;
  candy_atlas: string;
  bg: string;
}

class AssetService {
  private config: SeasonalConfig | null = null;
  private readonly DEFAULT_CONFIG: SeasonalConfig = {
    theme: 'Classic',
    candy_atlas: 'default_atlas',
    bg: 'default_bg',
  };

  async fetchConfig() {
    try {
      // Use a sample URL or one provided by user in the future
      const response = await axios.get('https://raw.githubusercontent.com/example/candy-crush-earner/main/seasonal_config.json', { timeout: 5000 });
      this.config = response.data;
      console.log('Seasonal Config Loaded:', this.config);
    } catch (error) {
      console.warn('Failed to fetch seasonal config, using defaults');
      this.config = this.DEFAULT_CONFIG;
    }
  }

  getConfig() {
    return this.config || this.DEFAULT_CONFIG;
  }
}

export default new AssetService();
