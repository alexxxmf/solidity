import attributesIcons from "../themes/Images";

export interface FwmAttributeDescription {
  id: string;
  icon: keyof typeof attributesIcons;
  attribute_name: string;
  url_friendly_name: string;
  what_is_it: string;
  why_develop_it: string;
}

const fwmAttributes: FwmAttributeDescription[] = [
  {
    id: "56e2d31f-12c9-4538-8b59-ee1986b412a9",
    attribute_name: "Resilience",
    url_friendly_name: "resilience",
    icon: "Resilience",
    what_is_it: "The ability to keep going despite challenges",
    why_develop_it:
      "Longer hours, constant change & new tech are all making work more stressful.\n\nResilience helps you handle stress better and enjoy your job even when it’s demanding."
  },
  {
    id: "9c341a96-3331-41f7-bcfc-afd262f2911c",
    attribute_name: "Self Leadership",
    url_friendly_name: "self_leadership",
    icon: "Self_Leadership",
    what_is_it:
      "The ability to set your own goals and be accountable for your decisions",
    why_develop_it:
      "As the work we do gets more complex, setting and meeting your own goals is a valuable skill.\n\nSelf-leadership helps you become the person you want to be while standing out at work."
  },
  {
    id: "1122a7e9-7b9f-434a-96df-e4dbb3cc17fc",
    attribute_name: "Forward Thinking",
    url_friendly_name: "forward_thinking",
    icon: "Forward_Thinking",
    what_is_it:
      "The ability to stay ahead of new trends and plan for the future",
    why_develop_it:
      "With technology changing the way we work faster than ever, staying ahead of the curve is essential.\n\nForward thinking helps you make the most of new possibilities and be ready for change."
  },
  {
    id: "b59f714f-b1a3-46d8-8851-82d2bfbd843f",
    attribute_name: "Productivity",
    url_friendly_name: "productivity",
    icon: "Productivity",
    what_is_it:
      "The ability to organise your time well and always get things done.",
    why_develop_it:
      "Busier lives and distracting tech have made us easier to distract than ever before.\n\nProductivity is there to helps you get everything done at work so you have more time for what you love."
  },
  {
    id: "1e386648-a536-4be7-bc45-4a869c7f596a",
    attribute_name: "Critical Thinking",
    url_friendly_name: "critical_thinking",
    icon: "Critical_Thinking",
    what_is_it: "The ability to use evidence effectively when making decisions",
    why_develop_it:
      "Even though we have so much information at our fingertips, most of us still make decisions on instinct.\n\nCritical thinking boosts your fact finding and lets you make the right decision more of the time."
  },
  {
    id: "4462e699-8e71-4eab-879b-dfd3cc2797f2",
    attribute_name: "Solution Finding",
    url_friendly_name: "solution_finding",
    icon: "Solution_Finding",
    what_is_it:
      "The ability to approach and overcome problems calmly and methodically",
    why_develop_it:
      "Our lives are full of new challenges and situations we havent faced before.\n\nSolution finding lets you approach problems carefully and make better decisions more of the time."
  },
  {
    id: "a3509ec8-2480-458a-8f34-e482a1940f50",
    attribute_name: "Integrity",
    url_friendly_name: "integrity",
    icon: "Integrity",
    what_is_it:
      "The ability to stay true to your beliefs no matter the situation",
    why_develop_it:
      "Whether colleagues, friends or family, evidence shows that people respect and value those who stay true to themselves.\n\nDeveloping your integrity gives you strength to make the right choices, not the easy choise, even in tough situations."
  },
  {
    id: "712cb299-79d7-4edc-a060-81dadef053dd",
    attribute_name: "Empathy",
    url_friendly_name: "empathy",
    icon: "Empathy",
    what_is_it:
      "The ability to connect with and appreciate the feelings of other people",
    why_develop_it:
      "Evidence shows us that the more we use technology, the less connected we are to those around us.\n\nBoosting your empathy helps you understand other people's feelings & motivations and be a better friend or colleague as a result."
  },
  {
    id: "f451cece-f0b7-44ab-b150-160c0f2d1608",
    attribute_name: "Verbal Comms",
    url_friendly_name: "verbal_comms",
    icon: "Verbal_Comms",
    what_is_it:
      "The ability to get your point across in conversation with anyone.",
    why_develop_it:
      "When it comes to customers, co-workers & managers, misunderstandings can be costly.\n\nVerbal comms is a crash course in the best speech patterns & style to be understood by any audience"
  },
  {
    id: "4baa4162-f73b-4127-becf-4ef9aa85693a",
    attribute_name: "Metacognition",
    url_friendly_name: "metacognition",
    icon: "Metacognition",
    what_is_it: "The ability to know yourself and reflect on your thoughts.",
    why_develop_it:
      "Despite sounding simple, most people struggle to accurately reflect on their strengths & weaknesses.\n\nMetacognition shows you the framework for good self-evaluation and boosts review performance. "
  },
  {
    id: "3e2d58c5-94f3-4207-a52d-40322e1c3eb3",
    attribute_name: "Visual Comms",
    url_friendly_name: "visual_comms",
    icon: "Visual_Comms",
    what_is_it: "The ability to design & create engaging visual information.",
    why_develop_it:
      "Humans are highly visual creatures, but most work presentations are confusing and dull.\n\nVisual comms gives you simple tricks to keep people focussed and get your point across."
  },
  {
    id: "e00c29bb-fe36-4be8-b677-b9fb29daa670",
    attribute_name: "Imagination",
    url_friendly_name: "imagination",
    icon: "Imagination",
    what_is_it: "The ability to think creatively and come up with new ideas.",
    why_develop_it:
      "Studies show than no matter how you may see yourself, each of us is born highly creative.\n\nWorking on your imagination lets you tap into that creativity more often and dream up big things."
  }
];
export default fwmAttributes;
