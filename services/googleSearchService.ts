

import { SearchResultItem } from '../types';

interface GoogleSearchApiResponse {
    items?: {
        title: string;
        link: string;
        snippet: string;
        pagemap?: {
            cse_thumbnail?: { src: string }[];
            videoobject?: { thumbnailurl: string }[];
        };
    }[];
    error?: {
        message: string;
    }
}

export const searchGoogle = async (query: string, apiKey?: string, cseId?: string): Promise<SearchResultItem[]> => {
    const key = apiKey || process.env.GOOGLE_API_KEY;
    const cx = cseId || process.env.GOOGLE_CSE_ID;

    if (!key || !cx) {
        console.warn("Contextual Search is not configured. Please set GOOGLE_API_KEY and GOOGLE_CSE_ID environment variables, or enter them in the app settings.");
        // We throw here so the UI can catch it and show a helpful message in the sidebar
        throw new Error("Search keys are missing. Please configure them in the Persona/Model settings step.");
    }
    
    const url = `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&q=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url);
        const data: GoogleSearchApiResponse = await response.json();
        
        if (!response.ok || data.error) {
            throw new Error(data.error?.message || `Google Search API request failed with status ${response.status}`);
        }

        if (!data.items) {
            return [];
        }

        return data.items.map(item => {
            let thumbnail: string | undefined = undefined;
            if (item.pagemap?.cse_thumbnail?.length) {
                thumbnail = item.pagemap.cse_thumbnail[0].src;
            } else if (item.pagemap?.videoobject?.length) {
                thumbnail = item.pagemap.videoobject[0].thumbnailurl;
            }

            return {
                title: item.title,
                link: item.link,
                snippet: item.snippet,
                thumbnail: thumbnail,
            };
        });
    } catch (error) {
        console.error("Error fetching from Google Custom Search API:", error);
        throw new Error(`Failed to fetch search results. ${(error as Error).message}`);
    }
};