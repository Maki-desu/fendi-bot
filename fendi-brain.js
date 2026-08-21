const memories = new Map();

const topicLibrary = {
  html: {
    keywords: ['html', 'tag', 'element', 'heading', 'paragraph', 'link', 'attribute'],
    intro: 'HTML is the structure of a webpage. Think of it like the skeleton of a page: headings, paragraphs, links, and buttons all live there.',
    followUp: 'A great HTML habit is using semantic tags like <header>, <main>, and <section> so your page is easier to read and maintain.'
  },
  css: {
    keywords: ['css', 'style', 'color', 'font', 'layout', 'flex', 'margin', 'padding'],
    intro: 'CSS is what makes a webpage look nice. It controls colors, spacing, fonts, layout, and overall visual style.',
    followUp: 'A really useful CSS trick is display: flex with gap to arrange items neatly without fighting with margins.'
  },
  javascript: {
    keywords: ['javascript', 'js', 'function', 'variable', 'array', 'object', 'event', 'click'],
    intro: 'JavaScript adds behavior. It can react to clicks, update content, validate forms, and make pages interactive.',
    followUp: 'JavaScript is especially useful when you add event listeners, so a button can run code when someone clicks it.'
  },
  discord: {
    keywords: ['discord', 'server', 'channel', 'bot', 'member', 'guild', 'message'],
    intro: 'Discord is a place for communities to chat, share, and build friendly spaces. Bots can help automate messages, moderation, and events.',
    followUp: 'A good Discord bot usually listens for messages and slash commands, then reacts to them in a helpful and respectful way.'
  },
  ai: {
    keywords: ['ai', 'chatbot', 'assistant', 'model', 'openai', 'llm', 'gpt'],
    intro: 'AI chatbots can understand prompts and generate text, but they still work best when you give clear, specific instructions.',
    followUp: 'The best AI prompts are clear and focused. For example: “Give me a short explanation of CSS flexbox with an example.”'
  },
  node: {
    keywords: ['node', 'nodejs', 'npm', 'package', 'express', 'module', 'import', 'require'],
    intro: 'Node.js lets JavaScript run outside the browser. It is useful for bots, servers, scripts, and command-line tools.',
    followUp: 'A practical Node.js workflow is npm install for dependencies, npm run for scripts, and import or require for modules.'
  },
  python: {
    keywords: ['python', 'pip', 'django', 'flask', 'tuple', 'list', 'def '],
    intro: 'Python is a readable general-purpose language used for automation, web apps, data work, and AI projects.',
    followUp: 'Keep Python projects tidy with a virtual environment, a requirements file, and small functions that each do one job.'
  },
  git: {
    keywords: ['git', 'github', 'commit', 'branch', 'merge', 'repository', 'repo'],
    intro: 'Git tracks changes to your code so you can review, share, and safely return to earlier versions.',
    followUp: 'A simple Git loop is status, add, commit, and push. Check the diff before committing so the snapshot says what you mean.'
  }
};

const responses = {
  greeting: [
    'Hii! I am Fendi, your tiny local helper. What shall we talk about? ^_^',
    'Hello there! Fendi is ready to help. Ask me anything I know! <3',
    'Hey hey! It is nice to see you. What is on your mind?'
  ],
  thanks: ['You are welcome! <3', 'Anytime! Fendi is happy to help.', 'No problem, friend!'],
  unknown: [
    'Ooh, that is an interesting question! I am still learning, but I am listening.',
    'I do not know that one yet, but I would love to learn. Could you ask it another way?',
    'I am not sure about that yet. Try asking about HTML, CSS, JavaScript, Discord, or AI.'
  ],
  mood: {
    sad: 'Aww, I am sorry you are feeling that way. You do not have to handle everything alone. I am here with you. <3',
    angry: 'That sounds really frustrating. Take a breath with me, then tell me what happened if you want to.',
    happy: 'That sounds wonderful! I am glad you are feeling good. Tell me what made your day brighter!'
  }
};

function choose(options, turn) {
  return options[turn % options.length];
}

function clean(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s+\-*/().]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getMemory(userId) {
  const memory = memories.get(userId) ?? {
    name: null,
    topic: null,
    favoriteTopic: null,
    facts: [],
    history: [],
    turns: 0
  };
  memory.turns++;
  memories.set(userId, memory);
  return memory;
}

function rememberFact(question, memory) {
  const rememberedText = question.match(/\b(?:remember|save)\s+(?:that\s+)?(.+)/i)?.[1]?.trim();
  if (!rememberedText) return null;
  const fact = rememberedText.replace(/[.!?]+$/, '');
  if (!fact) return null;
  memory.facts.push(fact);
  memory.facts = [...new Set(memory.facts)].slice(-6);
  return `Got it! I will remember that: ${fact}.`;
}

function scoreTopic(text, entry) {
  return entry.keywords.reduce((score, keyword) => score + (text.includes(keyword) ? 1 : 0), 0);
}

function bestTopic(text) {
  return Object.entries(topicLibrary)
    .map(([name, entry]) => ({
      name,
      entry,
      score: scoreTopic(text, entry) + (text.includes(name) ? 2 : 0)
    }))
    .sort((a, b) => b.score - a.score)[0];
}

function topicFollowUp(memory) {
  if (!memory.topic) return 'I would love to explain more! Tell me which topic you mean, like HTML, CSS, JavaScript, Discord, or AI.';
  return topicLibrary[memory.topic]?.followUp ?? 'I can explain that more. Tell me what part feels confusing.';
}

function recentConversation(memory) {
  const recent = memory.history.slice(-3).filter(Boolean);
  if (!recent.length) return 'We have not talked about anything yet. Ask me a question and I will keep track of it locally!';
  return `The most recent things you said were: ${recent.map(item => `"${item}"`).join(', ')}.`;
}

function detectMood(text) {
  if (/\b(sad|down|depressed|lonely|upset|crying|hurt)\b/.test(text)) return 'sad';
  if (/\b(angry|furious|mad|annoyed|frustrated|rage)\b/.test(text)) return 'angry';
  if (/\b(happy|excited|great|good|awesome|joyful|amazing)\b/.test(text)) return 'happy';
  return null;
}

function calculate(question) {
  const expression = question.replace(/\s/g, '');
  if (!/^[0-9+\-*/().]+$/.test(expression) || !/[+\-*/]/.test(expression)) return null;
  try {
    const result = Function(`"use strict"; return (${expression})`)();
    if (!Number.isFinite(result)) return null;
    return `The answer is ${result}. Math is neat, right? ^_^`;
  } catch {
    return null;
  }
}

export function createFendiBrain() {
  return {
    reply(question, userId) {
      const memory = getMemory(userId);
      const text = clean(question);
      const rawQuestion = question?.trim() ?? '';
      const nameMatch = rawQuestion.match(/\b(?:my name is|call me|i am|i'm)\s+([a-z][a-z -]{1,24})/i);
      const factResponse = rememberFact(rawQuestion, memory);

      memory.history.push(rawQuestion.slice(0, 180));
      memory.history = memory.history.slice(-8);

      if (factResponse) return factResponse;

      if (nameMatch) {
        memory.name = nameMatch[1].trim();
        return `Eee, nice to meet you, ${memory.name}! I will remember that, okay? ^_^`;
      }
      if (/\b(what is my name|do you remember my name|who am i)\b/.test(text)) {
        return memory.name ? `Your name is ${memory.name}! I remembered it! <3` : 'You have not told me your name yet, but I would love to know!';
      }
      if (/\b(what do you remember about me|what do you know about me|what do you remember)\b/.test(text)) {
        const facts = memory.facts.length ? ` You told me: ${memory.facts.join('; ')}.` : '';
        const nameLine = memory.name ? ` I know your name is ${memory.name}.` : ' I do not know your name yet.';
        return `${nameLine}${facts}`;
      }
      if (/\b(what did i say|what have i said|repeat my last|last message)\b/.test(text)) {
        const previousMessages = memory.history.slice(0, -1);
        const lastMessage = previousMessages.at(-1);
        return lastMessage ? `Your last message was: "${lastMessage}".` : 'That is your first message to me in this conversation!';
      }
      if (/\b(what are we talking about|what is the topic|current topic)\b/.test(text)) {
        return memory.topic
          ? `We are talking about ${memory.topic}. Ask me to explain more and I will continue locally!`
          : 'We do not have a topic yet. Try asking me about coding, Discord, or AI.';
      }
      if (/\b(recent conversation|conversation history|what have we discussed)\b/.test(text)) {
        return recentConversation(memory);
      }
      if (/\b(tell me more|explain more|continue|go on)\b/.test(text)) {
        return topicFollowUp(memory);
      }
      if (/\b(hello|hi|hey|greetings|yo|sup)\b/.test(text)) {
        return choose(responses.greeting, memory.turns);
      }
      if (text.includes('thank')) return choose(responses.thanks, memory.turns);
      if (text.includes('help') || text.includes('what can you do')) {
        return 'I can remember your name and facts, recall recent messages, follow topics, explain HTML/CSS/JavaScript/Discord/AI/Node.js/Python/Git, answer simple math, tell jokes, and hold a light conversation. I run locally without needing an API!';
      }
      if (text.includes('joke')) {
        return choose([
          'Why did the HTML element go to school? To improve its class attribute.',
          'I told my CSS a joke, but it needed better styling. Hehe!',
          'Why was the JavaScript developer calm? They knew how to handle their callbacks.',
          'My favorite debugging tool is a hug from the code editor. It fixes everything. ^_^'
        ], memory.turns);
      }
      if (text.includes('who are you') || text.includes('your name')) {
        return 'I am Fendi, a cute little local chatbot built to help with coding, Discord, and simple conversations. ^_^';
      }

      const mood = detectMood(text);
      if (mood) return responses.mood[mood];

      if (/\bfavorite\b/.test(text) && /(html|css|javascript|js|discord|ai|bot)/.test(text)) {
        const favoriteMatch = text.match(/\b(?:favorite|favourite)\s+(?:topic\s+)?(?:is\s+)?(html|css|javascript|js|discord|ai|bot)\b/i);
        if (favoriteMatch) {
          const favorite = favoriteMatch[1].toLowerCase();
          memory.favoriteTopic = favorite === 'js' ? 'javascript' : favorite;
          return `Aww, I like ${memory.favoriteTopic} too! It is a fun topic to explore together.`;
        }
      }

      const topicMatch = bestTopic(text);
      if (topicMatch && topicMatch.score > 0) {
        memory.topic = topicMatch.name;
        return topicLibrary[topicMatch.name].intro;
      }

      if ((text.includes('tell me about') || text.includes('what is')) && memory.topic) {
        const target = topicLibrary[memory.topic];
        if (target) return `${target.intro} ${target.followUp}`;
      }

      const mathAnswer = calculate(rawQuestion);
      if (mathAnswer) return mathAnswer;

      return `${choose(responses.unknown, memory.turns)} You said: "${rawQuestion.slice(0, 150)}".`;
    }
  };
}
