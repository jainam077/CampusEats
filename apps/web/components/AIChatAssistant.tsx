'use client';

import { useState, useRef, useEffect } from 'react';
import { dishes as localDishes } from '@/lib/demoData';

interface Dish {
  dish_id?: number;
  id?: number;
  name: string;
  description?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  dietary_tags?: string[];
  allergens?: string[];
  venue_name?: string;
  meal_type?: string;
  avg_rating?: number;
  review_count?: number;
  ingredients?: string;
  contains_pork?: boolean;
  fiber?: number;
  sodium?: number;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  dishes?: Dish[];
  isTyping?: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const INITIAL_MESSAGE: Message = {
  id: 0,
  role: 'assistant',
  content: "Hi! I'm your Campus Eats AI assistant 🍽️ Ask me anything!\n\nTry asking:\n• \"I'm hungry, what's good?\"\n• \"African food\" or \"Jamaican dishes\"\n• \"Desserts\" or \"something sweet\"\n• \"Mexican food\" or \"Asian cuisine\"",
};

export function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const formatDishResponse = (dishes: Dish[]): string => {
    let text = '';
    dishes.slice(0, 6).forEach((dish, i) => {
      text += (i + 1) + '. **' + dish.name + '**';
      if (dish.calories) text += ' - ' + dish.calories + ' cal';
      if (dish.protein) text += ', ' + dish.protein + 'g protein';
      text += '\n';
      if (dish.venue_name) text += '   📍 ' + dish.venue_name;
      if (dish.meal_type) text += ' • ' + dish.meal_type;
      text += '\n';
      if (dish.dietary_tags?.length) {
        text += '   🏷️ ' + dish.dietary_tags.slice(0, 4).join(', ') + '\n';
      }
      text += '\n';
    });
    if (dishes.length > 6) {
      text += '\n...and ' + (dishes.length - 6) + ' more options!';
    }
    return text;
  };

  const localSearch = (query: string): { dishes: Dish[], category: string } => {
    const q = query.toLowerCase();
    let results = [...localDishes] as Dish[];
    let category = '';

    if (q.includes('hungry') || q.includes('available') || q.includes('recommend') || 
        q.includes('suggest') || q.includes('what should') || q.includes("what's good") ||
        q.includes('surprise me') || q.includes('anything')) {
      results = results.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
      category = "🌟 Today's Top Picks";
      return { dishes: results.slice(0, 8), category };
    }

    if (q.includes('dessert') || q.includes('sweet') || q.includes('cake') || 
        q.includes('ice cream') || q.includes('brownie') || q.includes('pie') || 
        q.includes('chocolate') || q.includes('treat')) {
      results = results.filter(d => 
        d.dietary_tags?.includes('dessert') ||
        d.name?.toLowerCase().includes('cake') ||
        d.name?.toLowerCase().includes('pie') ||
        d.name?.toLowerCase().includes('brownie') ||
        d.name?.toLowerCase().includes('ice cream') ||
        d.name?.toLowerCase().includes('churro') ||
        d.name?.toLowerCase().includes('cheesecake') ||
        d.name?.toLowerCase().includes('tiramisu') ||
        d.description?.toLowerCase().includes('sweet') ||
        d.description?.toLowerCase().includes('dessert')
      );
      category = '🍰 Desserts & Sweets';
      return { dishes: results.slice(0, 10), category };
    }

    if (q.includes('african') || q.includes('jollof') || q.includes('nigerian') ||
        q.includes('ethiopian') || q.includes('moroccan') || q.includes('suya')) {
      results = results.filter(d => 
        d.dietary_tags?.includes('african') ||
        d.name?.toLowerCase().includes('jollof') ||
        d.name?.toLowerCase().includes('suya') ||
        d.name?.toLowerCase().includes('tagine') ||
        d.name?.toLowerCase().includes('fufu') ||
        d.description?.toLowerCase().includes('african')
      );
      category = '🌍 African Cuisine';
      return { dishes: results.slice(0, 10), category };
    }

    if (q.includes('jamaican') || q.includes('caribbean') || q.includes('jerk') ||
        q.includes('oxtail') || q.includes('patty') || q.includes('ackee')) {
      results = results.filter(d => 
        d.dietary_tags?.includes('jamaican') ||
        d.name?.toLowerCase().includes('jerk') ||
        d.name?.toLowerCase().includes('oxtail') ||
        d.name?.toLowerCase().includes('patty') ||
        d.description?.toLowerCase().includes('jamaican')
      );
      category = '🇯🇲 Jamaican & Caribbean';
      return { dishes: results.slice(0, 10), category };
    }

    if (q.includes('mexican') || q.includes('taco') || q.includes('burrito') ||
        q.includes('enchilada') || q.includes('quesadilla') || q.includes('nacho')) {
      results = results.filter(d => 
        d.dietary_tags?.includes('mexican') ||
        d.name?.toLowerCase().includes('taco') ||
        d.name?.toLowerCase().includes('burrito') ||
        d.name?.toLowerCase().includes('enchilada') ||
        d.name?.toLowerCase().includes('quesadilla') ||
        d.name?.toLowerCase().includes('nacho') ||
        d.name?.toLowerCase().includes('churro')
      );
      category = '🇲🇽 Mexican Cuisine';
      return { dishes: results.slice(0, 10), category };
    }

    if (q.includes('asian') || q.includes('chinese') || q.includes('thai') ||
        q.includes('japanese') || q.includes('vietnamese') || q.includes('korean') ||
        q.includes('sushi') || q.includes('pho') || q.includes('pad thai')) {
      results = results.filter(d => 
        d.name?.toLowerCase().includes('thai') ||
        d.name?.toLowerCase().includes('pho') ||
        d.name?.toLowerCase().includes('sushi') ||
        d.name?.toLowerCase().includes('korean') ||
        d.name?.toLowerCase().includes('stir fry') ||
        d.description?.toLowerCase().includes('asian')
      );
      category = '🍜 Asian Cuisine';
      return { dishes: results.slice(0, 10), category };
    }

    if (q.includes('comfort') || q.includes('soul food') || q.includes('southern') ||
        q.includes('fried chicken') || q.includes('mac and cheese') || q.includes('bbq')) {
      results = results.filter(d => 
        d.dietary_tags?.includes('comfort-food') ||
        d.name?.toLowerCase().includes('fried chicken') ||
        d.name?.toLowerCase().includes('mac') ||
        d.name?.toLowerCase().includes('waffles') ||
        d.name?.toLowerCase().includes('grits') ||
        d.description?.toLowerCase().includes('southern')
      );
      category = '🍗 Comfort Food';
      return { dishes: results.slice(0, 10), category };
    }

    if (q.includes('spicy') || q.includes('hot')) {
      results = results.filter(d => 
        d.dietary_tags?.includes('spicy') ||
        d.name?.toLowerCase().includes('spicy') ||
        d.name?.toLowerCase().includes('buffalo') ||
        d.name?.toLowerCase().includes('jerk') ||
        d.description?.toLowerCase().includes('spicy')
      );
      category = '🌶️ Spicy Dishes';
      return { dishes: results.slice(0, 10), category };
    }

    if (q.includes('vegan')) {
      results = results.filter(d => d.dietary_tags?.includes('vegan'));
      category = '🌱 Vegan Options';
      return { dishes: results.slice(0, 10), category };
    }

    if (q.includes('vegetarian')) {
      results = results.filter(d => d.dietary_tags?.includes('vegetarian') || d.dietary_tags?.includes('vegan'));
      category = '🥬 Vegetarian Options';
      return { dishes: results.slice(0, 10), category };
    }

    if (q.includes('protein') || q.includes('gains')) {
      results = results.filter(d => (d.protein || 0) >= 25).sort((a, b) => (b.protein || 0) - (a.protein || 0));
      category = '💪 High Protein';
      return { dishes: results.slice(0, 10), category };
    }

    if (q.includes('healthy') || q.includes('light') || q.includes('low cal')) {
      results = results.filter(d => (d.calories || 999) <= 400);
      category = '🥗 Healthy & Light';
      return { dishes: results.slice(0, 10), category };
    }

    if (q.includes('halal')) {
      results = results.filter(d => !d.contains_pork && d.dietary_tags?.includes('halal'));
      category = '☪️ Halal Options';
      return { dishes: results.slice(0, 10), category };
    }

    const words = q.split(' ').filter(w => w.length > 2);
    if (words.length > 0) {
      results = results.filter(d => 
        words.some(w => 
          d.name?.toLowerCase().includes(w) || 
          d.description?.toLowerCase().includes(w) ||
          d.ingredients?.toLowerCase().includes(w)
        )
      );
    }
    category = '🔍 Search Results';
    return { dishes: results.slice(0, 10), category };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
    const userMessage: Message = { id: Date.now(), role: 'user', content: userQuery };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const typingId = Date.now() + 1;
    setMessages(prev => [...prev, { id: typingId, role: 'assistant', content: '', isTyping: true }]);

    let responseText = '';
    let matchedDishes: Dish[] = [];

    const q = userQuery.toLowerCase();
    if (q.includes('help') || q.includes('what can you')) {
      responseText = "I can help you find food! Try asking:\n\n";
      responseText += "🌍 **Cuisines**: 'African food', 'Jamaican', 'Mexican', 'Asian'\n";
      responseText += "🍰 **Desserts**: 'something sweet', 'desserts', 'chocolate'\n";
      responseText += "🥗 **Dietary**: 'vegan', 'vegetarian', 'gluten-free', 'halal'\n";
      responseText += "💪 **Nutrition**: 'high protein', 'low calorie', 'healthy'\n";
      responseText += "😋 **General**: 'I'm hungry', 'what's good?'";
    } else {
      try {
        const res = await fetch(API_BASE + '/api/v1/recommendations/search?q=' + encodeURIComponent(userQuery) + '&limit=10');
        if (res.ok) {
          const data = await res.json();
          matchedDishes = data.results || [];
          if (matchedDishes.length > 0) {
            responseText = 'I found **' + matchedDishes.length + ' dishes** for you:\n\n' + formatDishResponse(matchedDishes);
          } else {
            throw new Error('No results');
          }
        } else {
          throw new Error('Backend unavailable');
        }
      } catch {
        const { dishes: localResults, category } = localSearch(userQuery);
        matchedDishes = localResults;
        if (matchedDishes.length > 0) {
          responseText = '**' + category + '**\n\nI found **' + matchedDishes.length + ' dishes** for you:\n\n' + formatDishResponse(matchedDishes);
        } else {
          responseText = 'I could not find anything matching "' + userQuery + '". Try:\n\n';
          responseText += '• **Cuisines**: African, Jamaican, Mexican, Asian\n';
          responseText += '• **Desserts**: cake, ice cream, churros\n';
          responseText += "• Or just say 'I'm hungry' for recommendations!";
        }
      }
    }

    setMessages(prev => [
      ...prev.filter(m => m.id !== typingId),
      { id: Date.now() + 2, role: 'assistant', content: responseText, dishes: matchedDishes }
    ]);
    setIsLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={'fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ' + (isOpen ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 animate-pulse hover:animate-none')}
      >
        {isOpen ? <span className="text-white text-2xl">✕</span> : <span className="text-3xl">🤖</span>}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[32rem] bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-700">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl">🤖</div>
              <div>
                <h3 className="font-bold">Campus Eats AI</h3>
                <p className="text-sm text-white/80">Your personal dining assistant</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={'flex ' + (message.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={'max-w-[85%] rounded-2xl px-4 py-3 ' + (message.role === 'user' ? 'bg-orange-500 text-white rounded-br-md' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-bl-md')}>
                  {message.isTyping ? (
                    <div className="flex gap-1 py-2">
                      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-200 dark:border-zinc-700">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about food options..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="w-12 h-12 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-300 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <span className="text-xl">→</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
