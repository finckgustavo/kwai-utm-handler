// utm-handler.js
(function () {
    // Configuration
    const SUPABASE_URL = 'https://elbmqemwuvdxchmmhmza.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsYm1xZW13dXZkeGNobW1obXphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4NzM1NjYsImV4cCI6MjA1MTQ0OTU2Nn0.K-0jDr78dQFiz1woW7BkxZKhG5J5vSubHCu3CwEONSs';
    const PIXEL_ID = document.currentScript.getAttribute('data-token');
  
    // Get user_id from pixel settings
    async function getUserId() {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/pixel_settings?pixel_id=eq.${PIXEL_ID}&select=user_id`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        });
  
        if (!response.ok) throw new Error('Failed to fetch user_id');
  
        const [data] = await response.json();
        return data?.user_id;
      } catch (error) {
        console.error('[Tracking] Failed to get user_id:', error);
        return null;
      }
    }
  
    // Parameter Management
    class TrackingParameters {
      constructor() {
        this.sessionId = crypto.randomUUID();
        this.urlParams = new URLSearchParams(window.location.search);
        this.defaultParams = {
          CampaignID: 'direct',
          adSETID: 'direct',
          CreativeID: 'direct',
          click_id: 'direct',
          pixel_id: PIXEL_ID,
          utm_campaign: 'direct',
          utm_medium: 'direct',
          utm_source: 'direct',
          utm_content: 'direct',
          utm_term: this.sessionId,
        };
      }
  
      getParam(key) {
        return this.urlParams.get(key) || this.defaultParams[key] || '';
      }
  
      getAllParams() {
        const params = {
          campaign_id: this.getParam('CampaignID'),
          adset_id: this.getParam('adSETID'),
          creative_id: this.getParam('CreativeID'),
          click_id: this.getParam('click_id'),
          pixel_id: PIXEL_ID,
          utm_campaign: this.getParam('utm_campaign'),
          utm_medium: this.getParam('utm_medium'),
          utm_source: this.getParam('utm_source'),
          utm_content: this.getParam('utm_content'),
          session_id: this.sessionId,
        };
  
        console.log('[Tracking] Parameters:', params);
        return params;
      }
  
      updateUrl() {
        const currentUrl = new URL(window.location.href);
        const existingParams = new URLSearchParams(currentUrl.search);
  
        const allParams = {
          CampaignID: this.getParam('CampaignID'),
          adSETID: this.getParam('adSETID'),
          CreativeID: this.getParam('CreativeID'),
          click_id: this.getParam('click_id'),
          pixel_id: this.defaultParams.pixel_id,
          utm_campaign: this.getParam('utm_campaign'),
          utm_medium: this.getParam('utm_medium'),
          utm_source: this.getParam('utm_source'),
          utm_content: this.getParam('utm_content'),
          utm_term: this.sessionId,
        };
  
        Object.entries(allParams).forEach(([key, value]) => {
          existingParams.set(key, value || '');
        });
  
        currentUrl.search = existingParams.toString();
        window.history.replaceState({}, '', currentUrl);
      }
    }
  
    // Database Integration
    class DatabaseManager {
      constructor() {
        this.supabaseUrl = SUPABASE_URL;
        this.supabaseKey = SUPABASE_ANON_KEY;
      }
  
      async saveTrackingEvent(params, userId) {
        if (!userId) {
          console.error('[Tracking] Missing user_id');
          return false;
        }
  
        try {
          const response = await fetch(`${this.supabaseUrl}/rest/v1/tracking_events`, {
            method: 'POST',
            headers: {
              'apikey': this.supabaseKey,
              'Authorization': `Bearer ${this.supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              ...params,
              user_id: userId,
            }),
          });
  
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Database error: ${response.status} - ${errorText}`);
          }
  
          console.log('[Tracking] Event saved successfully');
          return true;
        } catch (error) {
          console.error('[Tracking] Failed to save event:', error);
          return false;
        }
      }
    }
  
    // Main Tracking Manager
    class TrackingManager {
      constructor() {
        this.params = new TrackingParameters();
        this.db = new DatabaseManager();
        this.initialize();
      }
  
      async initialize() {
        try {
          const userId = await getUserId();
          if (!userId) throw new Error('Could not get user_id');
  
          console.log('[Tracking] Got user_id:', userId);
  
          this.params.updateUrl();
  
          const trackingParams = this.params.getAllParams();
          const success = await this.db.saveTrackingEvent(trackingParams, userId);
  
          if (success) {
            console.log('[Tracking] Initialized successfully');
          } else {
            throw new Error('Failed to save tracking event');
          }
        } catch (error) {
          console.error('[Tracking] Initialization failed:', error);
        }
      }
    }
  
    // Initialize tracking
    window.TrackingManager = new TrackingManager();
  })();
  