export interface AssessmentOption {
  label: string;
  score: number;
}

export interface AssessmentQuestion {
  text: string;
  options: AssessmentOption[];
}

export interface AssessmentCategory {
  name: string;
  questions: AssessmentQuestion[];
}

export const ASSESSMENT_CATEGORIES: AssessmentCategory[] = [
  {
    name: 'Brand, Reputation & Customer Mix',
    questions: [
      {
        text: "How strong is your company's reputation in your local market, and how clearly differentiated are you from competitors?",
        options: [
          { label: 'Weak', score: 1 },
          { label: 'Below average', score: 2 },
          { label: 'Average', score: 3 },
          { label: 'Strong & consistent', score: 4 },
          { label: 'Best-in-class', score: 5 },
        ],
      },
      {
        text: 'How dependent is your business on a small number of customers or referral sources?',
        options: [
          { label: 'High dependence', score: 1 },
          { label: 'Some dependence', score: 2 },
          { label: 'Balanced', score: 3 },
          { label: 'Low dependence', score: 4 },
          { label: 'No meaningful concentration', score: 5 },
        ],
      },
      {
        text: 'How dependent is your revenue on storms/hail, and how resilient would the business be if that segment/channel declined?',
        options: [
          { label: 'High dependence', score: 1 },
          { label: 'Some dependence', score: 2 },
          { label: 'Balanced', score: 3 },
          { label: 'Low dependence', score: 4 },
          { label: 'Not storm-driven / highly resilient', score: 5 },
        ],
      },
    ],
  },
  {
    name: 'Marketing & Lead Generation',
    questions: [
      {
        text: 'How consistent are your inbound leads month over month?',
        options: [
          { label: 'Highly inconsistent', score: 1 },
          { label: 'Somewhat inconsistent', score: 2 },
          { label: 'Average consistency', score: 3 },
          { label: 'High consistency', score: 4 },
          { label: 'Very consistent', score: 5 },
        ],
      },
      {
        text: 'How many distinct lead sources bring you regular business?',
        options: [
          { label: 'No defined sources', score: 1 },
          { label: '1 source', score: 2 },
          { label: '2 sources', score: 3 },
          { label: '3 sources', score: 4 },
          { label: '4+ sources', score: 5 },
        ],
      },
      {
        text: 'Do you have a documented marketing plan, track ROI by channel, and run a structured lead follow-up process?',
        options: [
          { label: 'None of the above', score: 1 },
          { label: 'One of three', score: 2 },
          { label: 'Two of three', score: 3 },
          { label: 'All three (inconsistent)', score: 4 },
          { label: 'All three (consistent)', score: 5 },
        ],
      },
    ],
  },
  {
    name: 'Sales & Estimating',
    questions: [
      {
        text: 'Do you track estimate-to-signed-job conversion rate and review it regularly?',
        options: [
          { label: 'Not tracked', score: 1 },
          { label: 'Tracked ad hoc', score: 2 },
          { label: 'Tracked sometimes', score: 3 },
          { label: 'Tracked monthly', score: 4 },
          { label: 'Tracked weekly', score: 5 },
        ],
      },
      {
        text: 'How standardized is your estimating/proposal process and how organized is your sales pipeline (stages, status, follow-ups)?',
        options: [
          { label: 'Not standardized', score: 1 },
          { label: 'Some standardization', score: 2 },
          { label: 'Mostly standardized', score: 3 },
          { label: 'Standardized & followed', score: 4 },
          { label: 'Fully standardized and audited', score: 5 },
        ],
      },
      {
        text: 'How often do projects meet or beat estimated profit margin, and how confident/trained is the sales team in closing?',
        options: [
          { label: 'Rarely', score: 1 },
          { label: 'Sometimes', score: 2 },
          { label: '50/50', score: 3 },
          { label: 'Often', score: 4 },
          { label: 'Almost always', score: 5 },
        ],
      },
    ],
  },
  {
    name: 'Operations & Production',
    questions: [
      {
        text: 'How predictable and organized is your job scheduling?',
        options: [
          { label: 'Chaotic', score: 1 },
          { label: 'Reactive', score: 2 },
          { label: 'Somewhat planned', score: 3 },
          { label: 'Predictable', score: 4 },
          { label: 'Strong & consistent', score: 5 },
        ],
      },
      {
        text: 'How consistently are jobs inspected for quality before completion, and how dependable/accountable are your crews or subcontractors?',
        options: [
          { label: 'Weak', score: 1 },
          { label: 'Below average', score: 2 },
          { label: 'Average', score: 3 },
          { label: 'Strong and consistent', score: 4 },
          { label: 'Best-in-class', score: 5 },
        ],
      },
      {
        text: 'How clear is communication between office, sales, and crews, and how soon after a project ends do you review actual vs estimated costs?',
        options: [
          { label: 'Weak', score: 1 },
          { label: 'Below average', score: 2 },
          { label: 'Average', score: 3 },
          { label: 'Strong and consistent', score: 4 },
          { label: 'Best-in-class', score: 5 },
        ],
      },
    ],
  },
  {
    name: 'People & Culture',
    questions: [
      {
        text: 'How steady is your core team, and how clearly does each team member know their role and goals?',
        options: [
          { label: 'Weak', score: 1 },
          { label: 'Below average', score: 2 },
          { label: 'Average', score: 3 },
          { label: 'Strong & consistent', score: 4 },
          { label: 'Best-in-class', score: 5 },
        ],
      },
      {
        text: "How prepared are others to step up if you're unavailable for a few weeks?",
        options: [
          { label: 'Not prepared', score: 1 },
          { label: 'Slightly prepared', score: 2 },
          { label: 'Somewhat prepared', score: 3 },
          { label: 'Mostly prepared', score: 4 },
          { label: 'Fully prepared', score: 5 },
        ],
      },
      {
        text: 'How structured is your process for hiring and training new people?',
        options: [
          { label: 'No process', score: 1 },
          { label: 'Informal', score: 2 },
          { label: 'Some structure', score: 3 },
          { label: 'Structured', score: 4 },
          { label: 'Best-in-class', score: 5 },
        ],
      },
    ],
  },
  {
    name: 'Technology & Systems',
    questions: [
      {
        text: 'How well do your core tools (CRM, accounting, project management) connect and share data?',
        options: [
          { label: 'Weak', score: 1 },
          { label: 'Below average', score: 2 },
          { label: 'Average', score: 3 },
          { label: 'Strong & consistent', score: 4 },
          { label: 'Best-in-class', score: 5 },
        ],
      },
      {
        text: "How consistently does your team use the systems you've invested in, and how confident are you that your data is accurate and up to date?",
        options: [
          { label: 'Weak', score: 1 },
          { label: 'Below average', score: 2 },
          { label: 'Average', score: 3 },
          { label: 'Strong & consistent', score: 4 },
          { label: 'Best-in-class', score: 5 },
        ],
      },
      {
        text: 'How much of your routine work is automated, and how often do you review/upgrade your tools or processes?',
        options: [
          { label: 'Not automated / never reviewed', score: 1 },
          { label: 'Minimal / rarely', score: 2 },
          { label: 'Some / sometimes', score: 3 },
          { label: 'Mostly / regularly', score: 4 },
          { label: 'Highly / continuous improvement', score: 5 },
        ],
      },
    ],
  },
  {
    name: 'Owner Dependence',
    questions: [
      {
        text: 'If you stepped away for 30–60 days, how well would the business continue to operate?',
        options: [
          { label: 'Would stall', score: 1 },
          { label: 'Barely operate', score: 2 },
          { label: 'Key employees would step up', score: 3 },
          { label: 'Mostly operate', score: 4 },
          { label: 'Fully operate without issues', score: 5 },
        ],
      },
      {
        text: 'How involved are you in day-to-day decisions, and how many key customer/supplier/partner relationships depend primarily on you?',
        options: [
          { label: 'Very involved / almost all relationships', score: 1 },
          { label: 'Very involved / many relationships', score: 2 },
          { label: 'Mixed', score: 3 },
          { label: 'Limited / few relationships', score: 4 },
          { label: 'Low / institutionalized', score: 5 },
        ],
      },
      {
        text: 'How prepared is your leadership team to run the business without you on a daily basis?',
        options: [
          { label: 'Not prepared', score: 1 },
          { label: 'Slightly prepared', score: 2 },
          { label: 'Somewhat prepared', score: 3 },
          { label: 'Mostly prepared', score: 4 },
          { label: 'Fully prepared', score: 5 },
        ],
      },
    ],
  },
  {
    name: 'Finance & Accounting',
    questions: [
      {
        text: 'How up to date and decision-ready are your financial statements (P&L, balance sheet, cash flow)?',
        options: [
          { label: 'Tax-time only', score: 1 },
          { label: 'Quarterly', score: 2 },
          { label: 'Monthly (late)', score: 3 },
          { label: 'Monthly (on time)', score: 4 },
          { label: 'Close ≤15 days + reviewed', score: 5 },
        ],
      },
      {
        text: 'How well do you manage cash flow (collections, reserves, forecasting)?',
        options: [
          { label: 'Weak', score: 1 },
          { label: 'Below average', score: 2 },
          { label: 'Average', score: 3 },
          { label: 'Strong & consistent', score: 4 },
          { label: 'Best-in-class', score: 5 },
        ],
      },
      {
        text: 'Are you using accrual-based accounting and job-level tracking, and how often do you review key financial metrics with leadership?',
        options: [
          { label: 'No / never', score: 1 },
          { label: 'Sometimes / rarely', score: 2 },
          { label: 'Sometimes / sometimes', score: 3 },
          { label: 'Mostly / monthly', score: 4 },
          { label: 'Yes / weekly+', score: 5 },
        ],
      },
      {
        text: 'How often do you review key financial metrics with leadership?',
        options: [
          { label: "They don't need to know metrics", score: 1 },
          { label: 'When things go wrong', score: 2 },
          { label: 'Sometimes', score: 3 },
          { label: 'Every month', score: 4 },
          { label: 'Best-in-class', score: 5 },
        ],
      },
    ],
  },
];
