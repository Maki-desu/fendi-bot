const memories = new Map();

const knowledge = [
  {
    topic: 'html',
    keywords: ['html', 'tag', 'element', 'heading', 'paragraph', 'webpage'],
    answer: 'HTML gives a webpage its structure and meaning. Use <h1> for the main heading, <p> for a paragraph, and <a> for a link.',
    followUp: 'HTML elements can have attributes. For example, href tells a link where to go, while src tells an image where to load from.'
  },
  {
    topic: 'css',
    keywords: ['css', 'style', 'color', 'font', 'layout', 'flexbox'],
    answer: 'CSS controls how a webpage looks: colors, spacing, fonts, borders, and layout. HTML is the structure; CSS is the outfit!',
    followUp: 'For an easy layout, try display: flex with gap for spacing. It is one of my favorite little CSS tricks!'
  },
  {
    topic: 'javascript',
    keywords: ['javascript', 'js', 'script', 'function', 'variable', 'click'],
    answer: 'JavaScript adds behavior to webpages. It can listen for clicks, change content, validate forms, and power interactive quizzes.',
    followUp: 'An event listener lets JavaScript react to actions. For example, a button can run a function when someone clicks it.'
  },
  {
    topic: 'discord',
    keywords: ['discord', 'server', 'channel', 'bot', 'member'],
    answer: 'Discord is a place for communities to chat. I am a bot living in your server, and you can talk to me by mentioning me.',
    followUp: 'Bots can respond to messages, register slash commands, and automate helpful tasks. I do those things locally!'
  }
];

const moodReplies = {
  sad: 'Aww, I am sorry you are feeling that way. I am here to listen, okay? You do not have to handle everything alone. <3',
  angry: 'That sounds really frustrating. Take a tiny breath with me, then tell me what happened if you want.',
  excited: 'Yay, I can feel the excitement! Tell me everything! ^_^'
};

const greetings = [
  'Hii! Fendi is here and ready to help! ^_^',
  'Hello, friend! What shall we explore today? <3',
  'Hey hey! I am listening. What is on your mind?'
];

const fallbackReplies = [
  'That is a thoughtful question. I am still learning, but I want to understand.',
  'Hmm, I do not know that yet. Could you explain it a different way?',
  'I am not sure about that one, but I can help with HTML, CSS, JavaScript, Discord, and simple math.'
];

function choose(options, turn) {
  return options[turn % options.length];
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9+\-*/().\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function getMemory(userId) {
  const memory = memories.get(userId) ?? {
    name: null,
    topic: null,
    facts: [],
    history: [],
    turns: 0
  };
  memory.turns++;
  memories.set(userId, memory);
  return memory;
}

function scoreKnowledge(text, entry) {
  return entry.keywords.reduce((score, keyword) => score + (text.includes(keyword) ? 1 : 0), 0);
}

function bestKnowledge(text) {
  return knowledge
    .map(entry => ({ entry, score: scoreKnowledge(text, entry) }))
    .sort((left, right) => right.score - left.score)[0];
}

function calculate(question) {
  const expression = question.replace(/\s/g, '');
  if (!/^[0-9+\-*/().]+$/.test(expression) || !/[+\-*/]/.test(expression)) return null;
  try {
    const result = Function(`"use strict"; return (${expression})`)();
    return Number.isFinite(result) ? `The answer is ${result}. Math is cute when it behaves! ^_^` : null;
  } catch {
    return null;
  }
}

function rememberFact(question, memory) {
  const match = question.match(/\bremember that\s+(.+)/i);
  if (!match) return null;
  const fact = match[1].trim().replace(/[.!?]+$/, '');
  memory.facts.push(fact);
  memory.facts = memory.facts.slice(-5);
  return `Got it! I will remember that ${fact}. My little memory is growing! ^_^`;
}

export function createFendiBrain() {
  return {
    reply(question, userId) {
      const memory = getMemory(userId);
      const text = normalize(question);
      const previousTopic = memory.topic;
      const nameMatch = question.match(/\b(?:my name is|call me)\s+([a-z][a-z -]{1,24})/i);
      const factResponse = rememberFact(question, memory);

      memory.history.push(question.slice(0, 180));
      memory.history = memory.history.slice(-8);

      if (factResponse) return factResponse;
      if (nameMatch) {
        memory.name = nameMatch[1].trim();
        return `Eee, nice to meet you, ${memory.name}! I will remember that, okay? ^_^`;
      }
      if (/\b(what is my name|do you remember my name)\b/.test(text)) {
        return memory.name ? `Your name is ${memory.name}! I remembered it! <3` : 'You have not told me your name yet, but I would love to know!';
      }
      if (/\b(what do you know about me|what do you remember)\b/.test(text)) {
        const facts = memory.facts.length ? ` You told me: ${memory.facts.join('; ')}.` : '';
        return memory.name ? `I know your name is ${memory.name}.${facts}` : `I do not know   your name yet.${facts}`;
      }
      if (/\b(tell me more|explain more|continue|go on)\b/.test(text)) {
        const entry = knowledge.find(item => item.topic === previousTopic);
        return entry?.followUp ?? 'I would love to explain more! Tell me which topic you mean, like HTML, CSS, JavaScript, or Discord.';
      }
      if (/\b(hello|hi|hey|greetings)\b/.test(text)) return choose(greetings, memory.turns);
      if (text.includes('help') || text.includes('what can you do')) {
        return 'I can remember names and facts, understand follow-ups, explain HTML/CSS/JavaScript, chat about Discord, answer simple math, and notice when someone is having a rough day. I run locally without an API!';
      }
      if (/\b(sad|unhappy|depressed|lonely|upset)\b/.test(text)) return moodReplies.sad;
      if (/\b(angry|mad|furious|annoyed|frustrated)\b/.test(text)) return moodReplies.angry;
      if (/\b(excited|amazing|awesome|yay)\b/.test(text)) return moodReplies.excited;
      if (text.includes('joke')) {
        return choose([
          'Why did the HTML element go to school? To improve its class attribute.',
          'I told my CSS a joke, but it needed better styling. Hehe!',
          'Why was the JavaScript developer calm? They knew how to handle their callbacks.'
        ], memory.turns);
      }
      if (text.includes('thank')) return choose(['You are welcome! <3', 'Anytime! Fendi is happy to help.', 'No problem, friend!'], memory.turns);
      if (text.includes('who are you') || text.includes('your name')) return 'I am Fendi, a cute local chatbot with a tiny memory and a big heart! ^_^';

      const knowledgeMatch = bestKnowledge(text);
      if (knowledgeMatch.score > 0) {
        memory.topic = knowledgeMatch.entry.topic;
        return knowledgeMatch.entry.answer;
      }

      const mathAnswer = calculate(question);
      if (mathAnswer) return mathAnswer;
      return `${choose(fallbackReplies, memory.turns)} You said: "${question.slice(0, 150)}".`;
    }
  };
}
