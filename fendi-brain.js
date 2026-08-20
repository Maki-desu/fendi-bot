const memories = new Map();

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
    'I am not sure about that yet. Try asking about HTML, CSS, JavaScript, or type help.'
  ]
};

function choose(options, turn) {
  return options[turn % options.length];
}

function getMemory(userId) {
  const memory = memories.get(userId) ?? { name: null, topic: null, turns: 0 };
  memory.turns++;
  memories.set(userId, memory);
  return memory;
}

function clean(text) {
  return text.toLowerCase().replace(/[?!.,]/g, '');
}

function answerForTopic(question, memory) {
  const text = clean(question);
  if (text.includes('html')) {
    memory.topic = 'html';
    return choose([
      'HTML is the structure of a webpage. Think of it as the skeleton: <h1> makes a heading, <p> makes a paragraph, and <a> makes a link!',
      'HTML tells the browser what content means. A simple page usually has <html>, <head>, and <body> elements.',
      'A good HTML page uses meaningful elements. Use headings for titles, lists for groups, and buttons for actions.'
    ], memory.turns);
  }
  if (text.includes('css')) {
    memory.topic = 'css';
    return 'CSS controls how a webpage looks: colors, spacing, fonts, borders, and layout. HTML is the structure; CSS is the cute outfit!';
  }
  if (text.includes('javascript') || /\bjs\b/.test(text)) {
    memory.topic = 'javascript';
    return 'JavaScript adds behavior. It can listen for clicks, change page content, validate forms, and power interactive quizzes.';
  }
  return null;
}

function topicFollowUp(memory) {
  const followUps = {
    html: 'More HTML magic: elements can have attributes, like href on a link or src on an image. Attributes add extra details to a tag!',
    css: 'A fun CSS tip: use display: flex to line things up, gap for spacing, and border-radius to make corners softer.',
    javascript: 'A fun JavaScript tip: an event listener lets your code react when someone clicks, types, or submits a form.'
  };
  return followUps[memory.topic] ?? null;
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
      const nameMatch = question.match(/\b(?:my name is|call me)\s+([a-z][a-z -]{1,24})/i);

      if (nameMatch) {
        memory.name = nameMatch[1].trim();
        return `Eee, nice to meet you, ${memory.name}! I will remember that for this conversation, okay? ^_^`;
      }
      if (/\b(what is my name|do you remember my name)\b/.test(text)) {
        return memory.name ? `Your name is ${memory.name}! I remembered it! <3` : 'You have not told me your name yet, but I would love to know!';
      }
      if (/\b(tell me more|explain more|continue|go on)\b/.test(text)) {
        return topicFollowUp(memory) ?? 'I would love to explain more! Tell me which topic you mean, like HTML, CSS, or JavaScript.';
      }
      if (/\b(hello|hi|hey|greetings)\b/.test(text)) {
        return choose(responses.greeting, memory.turns);
      }
      if (text.includes('help') || text.includes('what can you do')) {
        return 'I can remember your name, chat about HTML, CSS, and JavaScript, answer simple math, tell tiny jokes, and handle follow-up questions. I run locally without an API!';
      }
      if (text.includes('joke')) {
        return choose([
          'Why did the HTML element go to school? To improve its class attribute.',
          'I told my CSS a joke, but it needed better styling. Hehe!',
          'Why was the JavaScript developer calm? They knew how to handle their callbacks.'
        ], memory.turns);
      }
      if (text.includes('thank')) return choose(responses.thanks, memory.turns);

      const topicAnswer = answerForTopic(question, memory);
      if (topicAnswer) return topicAnswer;

      const mathAnswer = calculate(question);
      if (mathAnswer) return mathAnswer;

      if (text.includes('who are you') || text.includes('your name')) {
        return 'I am Fendi! I am a cute little local chatbot living inside this Discord bot. ^_^';
      }
      return `${choose(responses.unknown, memory.turns)} You said: "${question.slice(0, 150)}".`;
    }
  };
}
