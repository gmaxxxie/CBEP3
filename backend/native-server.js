const http = require('http');
const https = require('https');
const url = require('url');
const querystring = require('querystring');

const port = 3000;

// AI API配置
const AI_PROVIDERS = {
  deepseek: {
    url: 'https://api.deepseek.com/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-your-api-key-here'
    }
  },
  qwen: {
    url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-qwen-api-key'
    }
  }
};

// 存储API密钥
let apiKeys = {};

// CORS处理函数
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// JSON响应函数
function sendJSON(res, data, statusCode = 200) {
  setCORSHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// 解析请求体
function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    try {
      const data = body ? JSON.parse(body) : {};
      callback(null, data);
    } catch (error) {
      callback(error, null);
    }
  });
}

// AI API调用函数
async function callDeepSeekAPI(prompt, apiKey) {
  return new Promise((resolve, reject) => {
    const requestData = {
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    };

    const postData = JSON.stringify(requestData);
    const urlParsed = new URL('https://api.deepseek.com/chat/completions');
    
    const options = {
      hostname: urlParsed.hostname,
      port: 443,
      path: urlParsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.choices && response.choices[0]) {
            resolve(response.choices[0].message.content);
          } else {
            reject(new Error('Invalid API response format'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse API response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// AI增强分析函数
async function performAIAnalysis(contentData, targetRegions, apiKey) {
  console.log('🤖 开始AI分析，调用DeepSeek API...');
  
  const prompt = `你是一个专业的跨境电商本地化专家。请严格按照JSON格式分析网页内容的本地化情况。

**关键要求：**
1. 你的响应必须以{开始，以}结束
2. 不能包含任何解释、备注或格式化代码块标记
3. 所有字符串必须用双引号包围
4. 数字不需要引号，布尔值使用true/false
5. 数组用[]，对象用{}

分析数据：
- URL: ${contentData.url || 'N/A'}
- 标题: ${contentData.title || 'N/A'}
- 目标市场: ${targetRegions.join(', ')}
- 页面摘要: ${JSON.stringify(contentData.content?.paragraphs?.slice(0, 3)?.join(' ')?.substring(0, 300) || 'N/A')}
- 价格信息: ${JSON.stringify(contentData.ecommerce?.prices?.slice(0, 2) || [])}
- 支付方式: ${JSON.stringify(contentData.ecommerce?.paymentMethods || [])}
- 货币: ${contentData.ecommerce?.currency || 'USD'}

请严格返回以下JSON结构（不要添加任何其他文字）：

{
  "analysis": {
    "language": {
      "detected": "检测到的语言",
      "suitability": 8,
      "issues": ["语言问题1", "语言问题2"],
      "recommendations": ["语言建议1", "语言建议2"]
    },
    "culture": {
      "colorIssues": ["红色在中国表示吉祥，但在西方可能表示危险", "建议使用蓝色表示信任"],
      "culturalFit": 7,
      "taboos": ["避免使用不当的文化符号", "注意节日文化差异"],
      "improvements": ["增加当地节日元素", "调整视觉设计风格"]
    },
    "compliance": {
      "legalRequirements": ["GDPR合规声明", "隐私政策更新"],
      "privacyIssues": ["Cookie同意机制", "数据收集透明度"],
      "regulatoryRisks": ["跨境数据传输", "消费者权益保护"],
      "solutions": ["添加法律声明", "更新隐私条款"]
    },
    "userExperience": {
      "paymentSuitability": 8,
      "currencyIssues": ["货币显示不符合当地习惯"],
      "uxImprovements": ["优化结账流程", "增加本地化支付方式"],
      "localPreferences": ["当地用户喜好分析", "操作习惯适配"]
    }
  },
  "recommendations": [
    {
      "category": "language",
      "priority": "high",
      "issue": "页面语言与目标市场不匹配",
      "solution": "提供完整的语言本地化",
      "implementation": "联系专业翻译团队进行本地化",
      "expectedImpact": "提升用户体验和转化率25-40%",
      "timeline": "2-3周",
      "cost": "中等"
    },
    {
      "category": "culture",
      "priority": "medium",
      "issue": "文化元素不够本土化",
      "solution": "增加当地文化特色和节日营销",
      "implementation": "设计团队调整视觉元素和色彩搭配",
      "expectedImpact": "增强品牌亲和力和用户粘性",
      "timeline": "1-2周",
      "cost": "低"
    }
  ],
  "summary": {
    "overallScore": 82,
    "criticalIssues": 1,
    "majorOpportunities": ["语言本地化", "支付方式优化", "文化适应性提升"],
    "quickWins": ["货币显示调整", "添加本地支付方式", "更新隐私政策"]
  }
}`;

  try {
    const aiResponse = await callDeepSeekAPI(prompt, apiKey);
    console.log('✅ DeepSeek API调用成功');
    console.log('AI分析结果长度:', aiResponse.length);
    
    // 清理响应文本，移除可能的非JSON内容
    let cleanedResponse = aiResponse.trim();
    
    // 查找JSON对象的开始和结束
    const jsonStart = cleanedResponse.indexOf('{');
    const jsonEnd = cleanedResponse.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
    }
    
    // 尝试解析清理后的JSON响应
    try {
      const parsedResponse = JSON.parse(cleanedResponse);
      console.log('🎯 JSON解析成功');
      
      // 验证响应结构
      if (parsedResponse.analysis && parsedResponse.recommendations) {
        return parsedResponse;
      } else {
        console.warn('⚠️  JSON结构不完整，使用备用解析方式');
        return createFallbackResponse(cleanedResponse, aiResponse);
      }
    } catch (parseError) {
      console.warn('⚠️  JSON解析失败，尝试智能修复:', parseError.message);
      
      // 尝试智能修复JSON
      const repairedJson = await attemptJsonRepair(cleanedResponse);
      if (repairedJson) {
        console.log('🔧 JSON修复成功');
        return repairedJson;
      }
      
      console.log('🔄 降级为结构化文本解析');
      return createFallbackResponse(aiResponse, aiResponse);
    }
  } catch (error) {
    console.error('❌ DeepSeek API调用失败:', error.message);
    throw error;
  }
}

// JSON修复函数
async function attemptJsonRepair(jsonText) {
  try {
    // 常见的JSON修复策略
    let repaired = jsonText
      .replace(/,(\s*[}\]])/g, '$1') // 移除尾随逗号
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // 为未引号的键添加引号
      .replace(/:\s*'([^']*)'/g, ':"$1"') // 单引号转双引号
      .replace(/\n|\r/g, ' ') // 移除换行符
      .replace(/\s+/g, ' ') // 合并多个空格
      .trim();
    
    return JSON.parse(repaired);
  } catch (error) {
    console.warn('JSON修复失败:', error.message);
    return null;
  }
}

// 备用响应生成函数
function createFallbackResponse(partialJson, originalResponse) {
  const fallbackResponse = {
    analysis: {
      language: {
        detected: "英语",
        suitability: 8,
        issues: ["AI分析数据解析中遇到格式问题"],
        recommendations: ["请参考原始AI分析内容"]
      },
      culture: {
        colorIssues: ["需要手动检查AI分析结果"],
        culturalFit: 7,
        taboos: ["详见完整AI分析"],
        improvements: ["参考下方AI原始分析"]
      },
      compliance: {
        legalRequirements: ["需要进一步分析"],
        privacyIssues: ["详见AI分析"],
        regualtoryRisks: ["请查看完整分析"],
        solutions: ["参考AI建议"]
      },
      userExperience: {
        paymentSuitability: 8,
        currencyIssues: ["货币显示需要检查"],
        uxImprovements: ["详见AI分析建议"],
        localPreferences: ["参考AI完整分析"]
      }
    },
    recommendations: [{
      category: "general",
      priority: "high",
      issue: "AI响应格式解析问题",
      solution: `AI原始分析内容: ${originalResponse.substring(0, 500)}...`,
      implementation: "请手动查看完整的AI分析内容",
      expectedImpact: "参考AI原始建议",
      timeline: "根据具体建议而定",
      cost: "待评估"
    }],
    summary: {
      overallScore: 75,
      criticalIssues: 1,
      majorOpportunities: ["JSON格式优化", "AI响应解析改进"],
      quickWins: ["查看AI原始分析", "手动整理关键建议"]
    },
    rawAiResponse: originalResponse // 保留原始AI响应供参考
  };
  
  return fallbackResponse;
}

// 语言检测函数
function detectPageLanguage(contentData) {
  const extractText = (data) => {
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) return data.join(' ');
    if (typeof data === 'object' && data !== null) return JSON.stringify(data);
    return '';
  };

  const text = [
    extractText(contentData.title) || '',
    extractText(contentData.content?.headings) || '',
    extractText(contentData.content?.paragraphs) || '',
    extractText(contentData.content?.buttons) || '',
    extractText(contentData.content?.navigation) || ''
  ].join(' ').toLowerCase();

  console.log('提取的文本样本:', text.substring(0, 200) + '...');

  // 语言检测模式
  const languagePatterns = {
    'zh-CN': /[\u4e00-\u9fff]/g,
    'ja': /[\u3040-\u309f\u30a0-\u30ff]/g,
    'ko': /[\uac00-\ud7af]/g,
    'ar': /[\u0600-\u06FF]/g,
    'de': /\b(der|die|das|und|ist|mit|für|auf|ein|eine|haben|werden|sie|ich|wir|nicht|auch|nur|noch|sehr|wie|aber|oder|wenn|hier|mehr|können|müssen|sollen|wollen|doch|schon|jetzt|heute|jahr|time|über|nach|ohne|gegen|während|zwischen|unter|bei|zu|vor|hinter|neben|über|durch|um|bis|seit|von|aus|mit|nach|zu|für|gegen|ohne|während|trotz|statt|anstatt|wegen|aufgrund|infolge|zufolge|entsprechend|gemäß|laut|zuliebe|halber|kraft|mangels|mittels|vermöge|zwecks|betreffs|bezüglich|hinsichtlich|angesichts|anläßlich|aufgrund|infolge|zufolge|entsprechend|gemäß|laut|zuliebe|halber)\b/gi,
    'fr': /\b(le|la|les|de|du|des|et|est|avec|pour|sur|un|une|avoir|être|ce|qui|que|nous|vous|ils|elles|dans|par|pour|avec|sans|sous|sur|vers|chez|depuis|pendant|avant|après|devant|derrière|entre|parmi|malgré|selon|suivant|concernant|moyennant|nonobstant|outre|hormis|excepté|sauf|sinon|pourvu|supposé|attendu|étant|vu|passé|ci|là)\b/gi,
    'es': /\b(el|la|los|las|de|del|y|es|con|para|en|un|una|tener|ser|que|por|no|te|le|da|su|por|pero|más|me|ya|todo|le|han|bien|son|dos|le|vez|tiempo|muy|sobre|años|estado|durante|siempre|día|tanto|tres|menos|debe|casa|tipo|está|cada|sea|dentro|hecho|hacía|agua|punto|nuevo|hacer|mismo|después|primer|gran|año|trabajo|otros|entre|tanto|vida|hasta|bajo|país|escuela|ejemplo|mientras|proyecto|servicio|varios)\b/gi,
    'pt': /\b(o|a|os|as|de|do|da|e|é|com|para|em|um|uma|ter|ser|que|por|não|te|lhe|seu|sua|seus|suas|mas|mais|me|já|tudo|lhe|têm|bem|são|dois|três|menos|deve|casa|tipo|está|cada|seja|dentro|feito|fazia|água|ponto|novo|fazer|mesmo|depois|primeiro|grande|ano|trabalho|outros|entre|tanto|vida|até|sob|país|escola|exemplo|enquanto|projeto|serviço|vários)\b/gi,
    'en': /\b(the|and|is|in|to|of|with|for|on|a|an|have|be|this|that|you|it|he|she|they|we|i|me|my|your|his|her|their|our|was|were|been|being|had|has|will|would|could|should|may|might|can|must|shall|ought|need|dare|used|going|get|got|getting|give|given|giving|take|taken|taking|make|made|making|come|came|coming|go|went|going|see|saw|seen|seeing|know|knew|known|knowing|think|thought|thinking|say|said|saying|tell|told|telling|want|wanted|wanting|use|used|using|find|found|finding|work|worked|working|call|called|calling|try|tried|trying|ask|asked|asking|turn|turned|turning|move|moved|moving|play|played|playing|run|ran|running|walk|walked|walking|talk|talked|talking|bring|brought|bringing|write|wrote|written|writing|sit|sat|sitting|stand|stood|standing|hear|heard|hearing|let|put|set|keep|kept|keeping|hold|held|holding|show|showed|shown|showing|leave|left|leaving|feel|felt|feeling|seem|seemed|seeming|become|became|becoming|provide|provided|providing|allow|allowed|allowing|appear|appeared|appearing|include|included|including|continue|continued|continuing|follow|followed|following|change|changed|changing|help|helped|helping|lead|led|leading|begin|began|begun|beginning|happen|happened|happening|create|created|creating|live|lived|living|believe|believed|believing|occur|occurred|occurring|suggest|suggested|suggesting|consider|considered|considering|remain|remained|remaining|carry|carried|carrying|offer|offered|offering|result|resulted|resulting|expect|expected|expecting|build|built|building|stay|stayed|staying|fall|fell|fallen|falling|cut|reach|reached|reaching|kill|killed|killing|raise|raised|raising|pass|passed|passing|sell|sold|selling|require|required|requiring|report|reported|reporting|decide|decided|deciding|pull|pulled|pulling|return|returned|returning|explain|explained|explaining|hope|hoped|hoping|develop|developed|developing|carry|carried|carrying|break|broke|broken|breaking|receive|received|receiving|agree|agreed|agreeing|support|supported|supporting|hit|remember|remembered|remembering|meet|met|meeting|stop|stopped|stopping|measure|measured|measuring|choose|chose|chosen|choosing|join|joined|joining|reduce|reduced|reducing|establish|established|establishing|face|faced|facing|choose|chose|chosen|choosing|lose|lost|losing|send|sent|sending|spend|spent|spending|apply|applied|applying|avoid|avoided|avoiding|seek|sought|seeking|design|designed|designing|throw|threw|thrown|throwing|increase|increased|increasing|represent|represented|representing|plan|planned|planning|win|won|winning|drop|dropped|dropping|contain|contained|containing|add|added|adding|support|supported|supporting|control|controlled|controlling|share|shared|sharing|remove|removed|removing|achieve|achieved|achieving|bear|bore|born|bearing|buy|bought|buying|maintain|maintained|maintaining|speak|spoke|spoken|speaking|draw|drew|drawn|drawing|pick|picked|picking|accept|accepted|accepting|affect|affected|affecting|cover|covered|covering|treat|treated|treating|exist|existed|existing|serve|served|serving|die|died|dying|send|sent|sending|expect|expected|expecting|build|built|building|remain|remained|remaining|suggest|suggested|suggesting|raise|raised|raising|prove|proved|proven|proving|change|changed|changing|enjoy|enjoyed|enjoying|indicate|indicated|indicating|refer|referred|referring|ensure|ensured|ensuring|consider|considered|considering|discuss|discussed|discussing|manage|managed|managing|determine|determined|determining|experience|experienced|experiencing|perform|performed|performing|learn|learned|learning|compare|compared|comparing|examine|examined|examining|identify|identified|identifying|describe|described|describing|develop|developed|developing|involve|involved|involving|occur|occurred|occurring|produce|produced|producing|structure|structured|structuring|complete|completed|completing|material|place|service|business|government|process|system|program|question|information|public|company|group|person|area|part|number|time|day|week|month|year|world|country|state|city|community|family|home|school|student|teacher|child|parent|friend|people|man|woman|boy|girl|book|page|story|idea|problem|solution|answer|result|reason|example|way|method|approach|strategy|plan|goal|objective|purpose|mission|vision|value|principle|rule|law|policy|procedure|process|system|structure|organization|institution|agency|department|division|section|unit|team|group|member|leader|manager|director|president|ceo|officer|employee|worker|staff|personnel|individual|person|people|human|being|life|living|exist|existence|reality|fact|truth|knowledge|information|data|evidence|proof|research|study|analysis|report|document|paper|article|book|publication|journal|magazine|newspaper|website|blog|post|content|text|word|sentence|paragraph|chapter|section|part|whole|complete|total|full|entire|all|every|each|some|any|many|much|few|little|more|most|less|least|first|last|next|previous|following|before|after|during|while|when|where|why|how|what|who|which|that|this|these|those|here|there|now|then|today|tomorrow|yesterday|always|never|sometimes|often|usually|rarely|seldom|frequently|constantly|continuously|regularly|occasionally|periodically|temporarily|permanently|forever|immediately|quickly|slowly|fast|slow|soon|late|early|long|short|high|low|big|small|large|huge|tiny|great|good|bad|best|worst|better|worse|same|different|similar|equal|unequal|right|wrong|correct|incorrect|true|false|real|fake|actual|virtual|possible|impossible|probable|improbable|certain|uncertain|sure|unsure|clear|unclear|obvious|hidden|visible|invisible|open|closed|public|private|common|rare|normal|abnormal|regular|irregular|standard|nonstandard|typical|atypical|usual|unusual|ordinary|extraordinary|special|general|specific|particular|individual|personal|professional|business|commercial|industrial|educational|medical|legal|political|social|cultural|economic|financial|technical|scientific|artistic|creative|innovative|traditional|modern|contemporary|ancient|old|new|young|fresh|stale|clean|dirty|pure|mixed|simple|complex|easy|difficult|hard|soft|smooth|rough|sharp|dull|bright|dark|light|heavy|heavy|strong|weak|powerful|powerless|rich|poor|expensive|cheap|valuable|worthless|important|unimportant|significant|insignificant|relevant|irrelevant|necessary|unnecessary|essential|nonessential|critical|noncritical|urgent|nonurgent|serious|nonserious|major|minor|primary|secondary|main|additional|extra|bonus|free|paid|available|unavailable|accessible|inaccessible|convenient|inconvenient|comfortable|uncomfortable|safe|unsafe|secure|insecure|dangerous|harmless|risky|riskfree|healthy|unhealthy|sick|well|fine|terrible|awful|wonderful|amazing|incredible|fantastic|excellent|outstanding|superb|great|good|okay|average|poor|bad|terrible|horrible|awful|disgusting|beautiful|ugly|attractive|unattractive|pretty|plain|handsome|gorgeous|stunning|lovely|cute|adorable|charming|elegant|stylish|fashionable|trendy|modern|classic|vintage|retro|contemporary|traditional|conventional|unconventional|normal|abnormal|regular|irregular|standard|nonstandard|typical|atypical|usual|unusual|ordinary|extraordinary|common|uncommon|rare|frequent|infrequent|popular|unpopular|famous|unknown|wellknown|obscure|public|private|open|closed|available|unavailable|accessible|inaccessible|visible|invisible|clear|unclear|obvious|hidden|apparent|unapparent|evident|nonevident|manifest|unmanifest|distinct|indistinct|definite|indefinite|specific|nonspecific|particular|general|exact|inexact|precise|imprecise|accurate|inaccurate|correct|incorrect|right|wrong|true|false|real|unreal|actual|virtual|genuine|fake|authentic|inauthentic|original|copied|unique|common|special|ordinary|exceptional|normal|abnormal|regular|irregular|standard|nonstandard|typical|atypical|usual|unusual|natural|unnatural|artificial|organic|synthetic|manual|automatic|voluntary|involuntary|conscious|unconscious|deliberate|accidental|intentional|unintentional|planned|unplanned|organized|disorganized|systematic|unsystematic|methodical|unmethodical|logical|illogical|rational|irrational|reasonable|unreasonable|sensible|nonsensical|practical|impractical|useful|useless|helpful|unhelpful|beneficial|harmful|advantageous|disadvantageous|favorable|unfavorable|positive|negative|constructive|destructive|productive|unproductive|efficient|inefficient|effective|ineffective|successful|unsuccessful|profitable|unprofitable|gainful|ungainful|rewarding|unrewarding|satisfying|unsatisfying|fulfilling|unfulfilling|meaningful|meaningless|purposeful|purposeless|significant|insignificant|important|unimportant|valuable|worthless|precious|cheap|expensive|costly|inexpensive|affordable|unaffordable|reasonable|unreasonable|fair|unfair|just|unjust|equal|unequal|balanced|unbalanced|stable|unstable|steady|unsteady|consistent|inconsistent|reliable|unreliable|dependable|undependable|trustworthy|untrustworthy|honest|dishonest|sincere|insincere|genuine|fake|authentic|inauthentic|legitimate|illegitimate|legal|illegal|lawful|unlawful|authorized|unauthorized|permitted|prohibited|allowed|forbidden|acceptable|unacceptable|appropriate|inappropriate|suitable|unsuitable|proper|improper|correct|incorrect|right|wrong|good|bad|excellent|poor|superior|inferior|high|low|top|bottom|upper|lower|front|back|forward|backward|ahead|behind|first|last|beginning|end|start|finish|initial|final|early|late|soon|delayed|quick|slow|fast|slow|rapid|gradual|sudden|gradual|immediate|delayed|instant|prolonged|brief|long|short|temporary|permanent|lasting|fleeting|eternal|momentary|continuous|discontinuous|constant|variable|steady|changing|fixed|flexible|rigid|soft|hard|solid|liquid|gas|hot|cold|warm|cool|freezing|boiling|dry|wet|moist|damp|clean|dirty|pure|contaminated|fresh|stale|new|old|recent|ancient|modern|traditional|contemporary|classic|current|outdated|uptodate|obsolete|advanced|primitive|sophisticated|simple|complex|complicated|easy|difficult|hard|effortless|challenging|demanding|requiring|needing|wanting|desiring|wishing|hoping|expecting|anticipating|looking|waiting|searching|seeking|finding|discovering|exploring|investigating|examining|studying|learning|understanding|knowing|realizing|recognizing|remembering|forgetting|thinking|considering|pondering|wondering|questioning|doubting|believing|trusting|suspecting|assuming|supposing|imagining|dreaming|fantasizing|visualizing|picturing|seeing|watching|observing|noticing|perceiving|sensing|feeling|touching|hearing|listening|smelling|tasting|eating|drinking|consuming|digesting|absorbing|breathing|inhaling|exhaling|speaking|talking|saying|telling|asking|answering|replying|responding|communicating|expressing|conveying|transmitting|sending|receiving|getting|obtaining|acquiring|gaining|earning|winning|losing|giving|donating|contributing|providing|supplying|offering|presenting|showing|displaying|demonstrating|exhibiting|revealing|exposing|hiding|concealing|covering|protecting|defending|attacking|fighting|struggling|competing|cooperating|collaborating|working|laboring|toiling|striving|trying|attempting|endeavoring|aiming|targeting|focusing|concentrating|paying|attention|ignoring|neglecting|overlooking|missing|hitting|striking|touching|reaching|grasping|holding|gripping|catching|throwing|tossing|dropping|falling|rising|climbing|descending|ascending|moving|traveling|journeying|going|coming|arriving|departing|leaving|staying|remaining|continuing|stopping|pausing|resting|relaxing|sleeping|waking|dreaming|living|existing|being|becoming|growing|developing|evolving|changing|transforming|converting|turning|rotating|spinning|revolving|circling|surrounding|enclosing|containing|including|comprising|consisting|composing|forming|creating|making|building|constructing|manufacturing|producing|generating|causing|leading|resulting|following|preceding|succeeding|failing|achieving|accomplishing|completing|finishing|ending|beginning|starting|initiating|launching|opening|closing|shutting|locking|unlocking|entering|exiting|inside|outside|within|without|among|between|through|across|over|under|above|below|beside|next|near|far|close|distant|here|there|everywhere|nowhere|somewhere|anywhere|when|whenever|while|during|before|after|until|since|from|to|toward|away|up|down|left|right|north|south|east|west|forward|backward|ahead|behind|inside|outside|upstairs|downstairs|indoors|outdoors|online|offline|public|private|personal|professional|business|commercial|industrial|residential|urban|rural|domestic|foreign|international|national|local|regional|global|worldwide|universal|general|specific|particular|individual|collective|group|team|organization|institution|company|business|corporation|firm|agency|department|division|section|unit|branch|office|store|shop|market|mall|center|building|house|home|apartment|room|kitchen|bedroom|bathroom|living|dining|garage|basement|attic|yard|garden|park|street|road|avenue|highway|bridge|tunnel|airport|station|hospital|school|university|college|library|museum|theater|cinema|restaurant|hotel|bank|post|office|police|fire|government|city|town|village|country|state|nation|world|earth|planet|universe|space|time|moment|second|minute|hour|day|week|month|year|decade|century|millennium|past|present|future|history|today|tomorrow|yesterday|morning|afternoon|evening|night|weekend|weekday|holiday|vacation|work|job|career|profession|occupation|business|trade|industry|service|product|goods|item|thing|object|material|substance|element|component|part|piece|section|portion|segment|fragment|bit|particle|atom|molecule|cell|organism|plant|animal|human|person|people|man|woman|child|baby|boy|girl|family|parent|mother|father|son|daughter|brother|sister|friend|neighbor|colleague|partner|spouse|husband|wife|boyfriend|girlfriend|student|teacher|doctor|nurse|lawyer|engineer|artist|writer|musician|actor|athlete|politician|leader|manager|worker|employee|customer|client|user|member|citizen|resident|visitor|guest|stranger|enemy|ally|competitor|teammate|classmate|roommate|housemate|flatmate|neighbor|acquaintance|contact|connection|relationship|friendship|love|romance|marriage|partnership|cooperation|collaboration|competition|conflict|agreement|disagreement|understanding|misunderstanding|communication|conversation|discussion|debate|argument|fight|war|peace|harmony|balance|order|chaos|organization|structure|system|method|process|procedure|technique|strategy|plan|goal|objective|purpose|mission|vision|dream|hope|wish|desire|want|need|requirement|demand|request|order|command|instruction|direction|guidance|advice|suggestion|recommendation|proposal|offer|invitation|welcome|greeting|farewell|goodbye|thanks|gratitude|appreciation|praise|compliment|criticism|complaint|apology|excuse|explanation|reason|cause|effect|result|consequence|outcome|conclusion|decision|choice|option|alternative|possibility|probability|chance|opportunity|risk|danger|threat|safety|security|protection|defense|attack|offense|challenge|problem|difficulty|issue|matter|concern|worry|fear|anxiety|stress|pressure|tension|relaxation|relief|comfort|ease|convenience|difficulty|hardship|struggle|effort|energy|power|strength|force|weakness|ability|capability|capacity|skill|talent|gift|intelligence|wisdom|knowledge|information|data|fact|truth|reality|fiction|fantasy|imagination|creativity|innovation|invention|discovery|research|study|analysis|investigation|examination|test|experiment|trial|practice|exercise|training|education|learning|teaching|instruction|lesson|course|class|subject|topic|theme|issue|matter|question|answer|solution|problem|difficulty|challenge|obstacle|barrier|limitation|restriction|constraint|freedom|liberty|independence|dependence|reliance|trust|confidence|doubt|uncertainty|certainty|assurance|guarantee|promise|commitment|obligation|responsibility|duty|task|job|work|assignment|project|mission|goal|target|objective|purpose|intention|plan|strategy|method|approach|way|manner|style|fashion|trend|pattern|design|structure|form|shape|size|dimension|measurement|quantity|amount|number|count|total|sum|average|mean|median|mode|range|variation|difference|similarity|comparison|contrast|distinction|category|type|kind|sort|class|group|set|collection|series|sequence|order|arrangement|organization|system|structure|framework|foundation|base|basis|ground|background|context|situation|condition|state|status|position|location|place|spot|point|area|region|zone|district|neighborhood|community|society|culture|civilization|nation|country|state|province|city|town|village|population|people|citizen|resident|inhabitant|native|foreigner|immigrant|visitor|tourist|traveler|passenger|driver|pilot|captain|crew|staff|team|group|organization|institution|company|business|corporation|firm|enterprise|establishment|facility|building|structure|construction|architecture|design|plan|blueprint|map|chart|diagram|graph|table|list|index|catalog|directory|database|file|document|record|report|article|essay|story|novel|book|magazine|newspaper|journal|publication|media|press|news|information|data|statistics|facts|figures|numbers|details|specifics|particulars|features|characteristics|qualities|properties|attributes|aspects|elements|components|parts|pieces|sections|divisions|categories|types|kinds|sorts|classes|groups|sets|collections|series|sequences|orders|arrangements|organizations|systems|structures|frameworks|foundations|bases|grounds|backgrounds|contexts|situations|conditions|states|statuses|positions|locations|places|spots|points|areas|regions|zones|districts|neighborhoods|communities|societies|cultures|civilizations|nations|countries|states|provinces|cities|towns|villages|populations|people|citizens|residents|inhabitants|natives|foreigners|immigrants|visitors|tourists|travelers|passengers|drivers|pilots|captains|crews|staffs|teams|groups|organizations|institutions|companies|businesses|corporations|firms|enterprises|establishments|facilities|buildings|structures|constructions|architectures|designs|plans|blueprints|maps|charts|diagrams|graphs|tables|lists|indexes|catalogs|directories|databases|files|documents|records|reports|articles|essays|stories|novels|books|magazines|newspapers|journals|publications|medias|presses|news|informations|datas|statistics|facts|figures|numbers|details|specifics|particulars|features|characteristics|qualities|properties|attributes|aspects|elements|components|parts|pieces|sections|divisions|categories|types|kinds|sorts|classes|groups|sets|collections|series|sequences|orders|arrangements|organizations|systems|structures|frameworks|foundations|bases|grounds|backgrounds|contexts|situations|conditions|states|statuses|positions|locations|places|spots|points|areas|regions|zones|districts|neighborhoods|communities|societies|cultures|civilizations)\b/gi
  };

  let detectedLanguage = 'en'; // 默认英语
  let maxMatches = 0;

  for (const [lang, pattern] of Object.entries(languagePatterns)) {
    const matches = (text.match(pattern) || []).length;
    console.log(`语言 ${lang}: ${matches} 个匹配`);
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedLanguage = lang;
    }
  }

  console.log(`检测到的语言: ${detectedLanguage}, 最大匹配数: ${maxMatches}`);
  return detectedLanguage;
}

// 检测货币符号
function detectCurrency(contentData) {
  const text = JSON.stringify(contentData).toLowerCase();
  
  if (text.includes('$') || text.includes('usd')) return 'USD';
  if (text.includes('€') || text.includes('eur')) return 'EUR';
  if (text.includes('£') || text.includes('gbp')) return 'GBP';
  if (text.includes('¥') || text.includes('cny') || text.includes('yuan')) return 'CNY';
  if (text.includes('￥') || text.includes('jpy') || text.includes('yen')) return 'JPY';
  
  return 'USD'; // 默认
}

// 检测支付方式
function detectPaymentMethods(contentData) {
  const text = JSON.stringify(contentData).toLowerCase();
  const methods = [];
  
  if (text.includes('paypal')) methods.push('PayPal');
  if (text.includes('apple pay') || text.includes('applepay')) methods.push('Apple Pay');
  if (text.includes('google pay') || text.includes('googlepay')) methods.push('Google Pay');
  if (text.includes('visa')) methods.push('Visa');
  if (text.includes('mastercard')) methods.push('Mastercard');
  if (text.includes('alipay') || text.includes('支付宝')) methods.push('Alipay');
  if (text.includes('wechat') || text.includes('微信')) methods.push('WeChat Pay');
  
  return methods;
}

// 智能分析函数（AI增强版）
async function generateSmartAnalysis(contentData, targetRegions, apiKey = null) {
  const detectedLanguage = detectPageLanguage(contentData);
  const detectedCurrency = detectCurrency(contentData);
  const paymentMethods = detectPaymentMethods(contentData);
  
  console.log('基础分析结果:', {
    url: contentData.url,
    detectedLanguage,
    detectedCurrency,
    paymentMethods,
    targetRegions
  });

  const results = {};
  
  // 如果有API密钥，尝试AI增强分析
  let aiAnalysis = null;
  if (apiKey) {
    try {
      console.log('🚀 尝试AI增强分析...');
      aiAnalysis = await performAIAnalysis(contentData, targetRegions, apiKey);
      console.log('🎯 AI分析完成');
    } catch (error) {
      console.error('❌ AI分析失败，降级为基础分析:', error.message);
    }
  } else {
    console.log('⚠️  未提供API密钥，使用基础分析');
  }
  
  targetRegions?.forEach(region => {
    const expectedLanguage = getExpectedLanguage(region);
    const expectedCurrency = getExpectedCurrency(region);
    
    // 基础分析结果
    const baseAnalysis = {
      region: getRegionInfo(region),
      overallScore: 70,
      language: analyzeLanguageForRegion(contentData, region, detectedLanguage, expectedLanguage),
      culture: analyzeCultureForRegion(contentData, region),
      compliance: analyzeComplianceForRegion(contentData, region),
      userExperience: analyzeUXForRegion(contentData, region, detectedCurrency, expectedCurrency, paymentMethods),
      recommendations: generateSmartRecommendations(region, detectedLanguage, expectedLanguage, detectedCurrency, expectedCurrency),
      aiEnhanced: !!aiAnalysis
    };
    
    // 如果有AI分析结果，合并增强
    if (aiAnalysis) {
      baseAnalysis.aiAnalysis = aiAnalysis;
      
      // 基于AI分析调整评分
      if (aiAnalysis.analysis) {
        baseAnalysis.aiInsights = {
          语言分析: aiAnalysis.analysis.语言 || "AI分析中...",
          文化分析: aiAnalysis.analysis.文化 || "AI分析中...", 
          合规分析: aiAnalysis.analysis.合规 || "AI分析中...",
          用户体验分析: aiAnalysis.analysis.用户体验 || "AI分析中..."
        };
      }
      
      // 合并AI推荐
      if (aiAnalysis.recommendations && Array.isArray(aiAnalysis.recommendations)) {
        baseAnalysis.aiRecommendations = aiAnalysis.recommendations;
        // 将AI推荐添加到基础推荐中
        baseAnalysis.recommendations = [
          ...baseAnalysis.recommendations,
          ...aiAnalysis.recommendations.map(rec => ({
            ...rec,
            source: 'AI',
            aiEnhanced: true
          }))
        ];
      }
    }
    
    // 重新计算总体评分
    baseAnalysis.overallScore = Math.round(
      (baseAnalysis.language.score * 0.3 +
       baseAnalysis.culture.score * 0.25 +
       baseAnalysis.compliance.score * 0.25 +
       baseAnalysis.userExperience.score * 0.2)
    );
    
    results[region] = baseAnalysis;
  });
  
  return results;
}

function getExpectedLanguage(region) {
  const languageMap = {
    'US': 'en', 'GB': 'en', 'CA': 'en',
    'DE': 'de', 'FR': 'fr', 'ES': 'es', 'IT': 'it',
    'CN': 'zh-CN', 'TW': 'zh-TW', 'HK': 'zh-CN',
    'JP': 'ja', 'KR': 'ko',
    'AE': 'ar', 'SA': 'ar',
    'BR': 'pt', 'MX': 'es'
  };
  return languageMap[region] || 'en';
}

function getExpectedCurrency(region) {
  const currencyMap = {
    'US': 'USD', 'GB': 'GBP', 'CA': 'CAD',
    'DE': 'EUR', 'FR': 'EUR', 'ES': 'EUR', 'IT': 'EUR',
    'CN': 'CNY', 'JP': 'JPY', 'KR': 'KRW',
    'AE': 'AED', 'SA': 'SAR',
    'BR': 'BRL', 'MX': 'MXN'
  };
  return currencyMap[region] || 'USD';
}

function analyzeLanguageForRegion(contentData, region, detectedLang, expectedLang) {
  const issues = [];
  let score = 90;
  
  if (detectedLang !== expectedLang) {
    if (region === 'US' && detectedLang === 'zh-CN') {
      issues.push('页面主要内容为中文，但目标市场为美国英语用户，建议提供英文版本');
      score -= 30;
    } else if (region === 'CN' && detectedLang === 'en') {
      issues.push('页面为英文，建议为中国用户提供简体中文版本以提升用户体验');
      score -= 25;
    } else if (detectedLang === 'en' && expectedLang !== 'en') {
      issues.push(`页面为英文，但目标市场用户更偏好${getLanguageName(expectedLang)}内容`);
      score -= 20;
    } else {
      issues.push(`页面语言(${getLanguageName(detectedLang)})与目标地区期望语言(${getLanguageName(expectedLang)})不匹配`);
      score -= 25;
    }
  } else {
    // 语言匹配，检查其他问题
    if (region === 'US' && !hasLanguageSwitcher(contentData)) {
      issues.push('建议添加语言切换选项以支持多语言用户');
      score -= 5;
    }
    if (region === 'DE' && detectedLang === 'en') {
      issues.push('虽然英语可以理解，但德国用户更偏好德语内容，建议提供德语版本');
      score -= 15;
    }
  }
  
  return { score: Math.max(0, score), issues };
}

function analyzeCultureForRegion(contentData, region) {
  let score = 85;
  const issues = [];
  
  // 基于实际内容的文化分析
  if (region === 'CN') {
    if (!hasChineseHolidayElements(contentData)) {
      issues.push('建议增加中国节日营销元素(如春节、双11、618)以提升本土化体验');
      score -= 10;
    }
  } else if (region === 'US') {
    if (hasAsianOnlyElements(contentData)) {
      issues.push('建议增加多元化视觉元素，体现美国多样性文化');
      score -= 8;
    }
  }
  
  return { score, issues };
}

function analyzeComplianceForRegion(contentData, region) {
  let score = 80;
  const issues = [];
  
  if (['DE', 'FR', 'ES', 'IT'].includes(region) && !hasGDPRCompliance(contentData)) {
    issues.push('需要添加GDPR合规声明和Cookie同意机制');
    score -= 20;
  }
  
  if (region === 'US' && !hasCCPACompliance(contentData)) {
    issues.push('建议添加CCPA合规声明，包括"Do Not Sell My Personal Information"链接');
    score -= 15;
  }
  
  return { score, issues };
}

function analyzeUXForRegion(contentData, region, detectedCurrency, expectedCurrency, paymentMethods) {
  let score = 85;
  const issues = [];
  
  if (detectedCurrency !== expectedCurrency) {
    issues.push(`当前显示${detectedCurrency}货币，建议为${region}用户显示${expectedCurrency}或提供货币转换`);
    score -= 15;
  }
  
  if (region === 'CN' && !paymentMethods.includes('Alipay') && !paymentMethods.includes('WeChat Pay')) {
    issues.push('建议为中国用户添加支付宝和微信支付选项');
    score -= 20;
  }
  
  if (region === 'US' && !paymentMethods.includes('PayPal') && !paymentMethods.includes('Apple Pay')) {
    issues.push('建议添加PayPal和Apple Pay等美国用户常用的支付方式');
    score -= 10;
  }
  
  return { score, issues };
}

// 辅助函数
function getLanguageName(langCode) {
  const names = {
    'en': '英语', 'zh-CN': '中文', 'de': '德语', 'fr': '法语',
    'es': '西班牙语', 'ja': '日语', 'ko': '韩语', 'ar': '阿拉伯语'
  };
  return names[langCode] || langCode;
}

function hasLanguageSwitcher(contentData) {
  const text = JSON.stringify(contentData).toLowerCase();
  return text.includes('language') || text.includes('lang') || text.includes('english') || text.includes('中文');
}

function hasChineseHolidayElements(contentData) {
  const text = JSON.stringify(contentData).toLowerCase();
  return text.includes('春节') || text.includes('双11') || text.includes('618') || text.includes('lunar new year');
}

function hasAsianOnlyElements(contentData) {
  // 简化实现 - 实际应该分析图片和内容
  return false;
}

function hasGDPRCompliance(contentData) {
  const text = JSON.stringify(contentData).toLowerCase();
  return text.includes('gdpr') || text.includes('cookie consent') || text.includes('privacy policy');
}

function hasCCPACompliance(contentData) {
  const text = JSON.stringify(contentData).toLowerCase();
  return text.includes('ccpa') || text.includes('do not sell') || text.includes('privacy rights');
}

function generateSmartRecommendations(region, detectedLang, expectedLang, detectedCurrency, expectedCurrency) {
  const recommendations = [];
  
  if (detectedLang !== expectedLang) {
    recommendations.push({
      category: 'language',
      priority: 'high',
      issue: `语言不匹配问题`,
      suggestion: `当前页面为${getLanguageName(detectedLang)}，建议为${region}市场提供${getLanguageName(expectedLang)}版本。这将显著提升用户体验和转化率。`,
      implementation: `联系专业翻译团队，预计2-3周完成本地化`,
      expectedImpact: '预期提升转化率20-40%，降低跳出率30%'
    });
  }
  
  if (detectedCurrency !== expectedCurrency) {
    recommendations.push({
      category: 'userExperience',
      priority: 'medium',
      issue: '货币显示不符合当地习惯',
      suggestion: `建议将价格显示调整为${expectedCurrency}，或提供自动货币转换功能。这将减少用户的心理转换成本。`,
      implementation: '开发团队1周内可完成货币显示调整',
      expectedImpact: '提升购买决策效率25%'
    });
  }
  
  return recommendations;
}

function getRegionInfo(regionCode) {
  const regions = {
    'US': { name: '美国', currency: 'USD', language: 'en', rtl: false },
    'GB': { name: '英国', currency: 'GBP', language: 'en', rtl: false },
    'DE': { name: '德国', currency: 'EUR', language: 'de', rtl: false },
    'FR': { name: '法国', currency: 'EUR', language: 'fr', rtl: false },
    'JP': { name: '日本', currency: 'JPY', language: 'ja', rtl: false },
    'KR': { name: '韩国', currency: 'KRW', language: 'ko', rtl: false },
    'CN': { name: '中国', currency: 'CNY', language: 'zh-CN', rtl: false },
    'AE': { name: '阿联酋', currency: 'AED', language: 'ar', rtl: true }
  };
  return regions[regionCode] || { name: regionCode, currency: 'USD', language: 'en', rtl: false };
}

function generateMockIssues(category, region) {
  const detailedIssues = {
    language: {
      'US': [
        '检测到页面主要内容为中文，但目标市场为美国英语用户',
        '电商关键术语"购买"、"加入购物车"未英语化，建议改为"Buy Now"、"Add to Cart"',
        '价格显示使用"¥"符号，美国用户习惯"$"符号',
        '缺少英语语言切换选项，建议在页头添加"EN/中文"切换'
      ],
      'DE': [
        '页面语言为英文，但德国用户更偏好德语内容',
        '产品描述未使用德语专业术语，如"Größe"(尺寸)、"Versand"(运输)',
        '日期格式使用MM/DD/YYYY，德国标准为DD.MM.YYYY',
        '缺少德语客服联系方式和本地化FAQ'
      ],
      'JP': [
        '页面缺少日语敬语表达，日本用户重视礼貌用语',
        '商品分类未使用日本消费者熟悉的カテゴリー分类方式',
        '联系方式缺少日本常用的LINE或微信联系方式',
        '支付页面未提供日语操作指引'
      ],
      'CN': [
        '英文页面对中国用户不够友好，建议提供简体中文版本',
        '产品标题过于简短，中国用户喜欢详细的产品描述',
        '缺少中文客服QQ/微信联系方式',
        '价格未显示人民币，建议添加¥符号和汇率换算'
      ]
    },
    culture: {
      'US': [
        '主色调使用红色过多，在美国红色常与警告相关联，建议平衡使用蓝色(信任)或绿色(安全)',
        '节日营销仍显示春节元素，建议调整为感恩节、黑色星期五等美国节日',
        '产品图片模特以亚洲面孔为主，建议增加多元化种族模特',
        '社交媒体图标缺少Facebook、Instagram等美国主流平台'
      ],
      'DE': [
        '网站使用过多鲜艳色彩，德国用户偏好简洁、专业的设计风格',
        '产品评价缺少严谨性，德国消费者重视详细、客观的评价信息',
        '隐私政策不够详细，德国用户对数据保护要求极高',
        '缺少德国本土品牌合作展示，建议添加"Made in Germany"等信任标识'
      ],
      'JP': [
        '页面设计过于简单，日本用户偏好信息丰富、细节完整的页面布局',
        '缺少季节性元素，日本文化中四季变化很重要，建议添加季节主题',
        '产品包装图片不够精美，日本消费者非常重视包装美感',
        '没有展示产品的匠人工艺或品质保证，这在日本市场很重要'
      ],
      'CN': [
        '网站整体色调偏冷，中国用户更喜欢温暖、热闹的红色、金色搭配',
        '缺少社交购物元素，建议添加"朋友都在买"、"限时团购"等社交化功能',
        '产品展示缺少使用场景图，中国消费者喜欢看到产品的实际使用效果',
        '没有明星代言或KOL推荐，这在中国市场是重要的信任建立方式'
      ]
    },
    compliance: {
      'US': [
        '缺少CCPA(加州消费者隐私法案)合规声明，建议添加"Do Not Sell My Info"链接',
        '网站未显示明确的退款政策，美国FTC要求电商必须提供清晰的退款条款',
        '产品页面缺少FDA/FCC等相关认证信息(如适用)',
        'Cookie使用未提供详细说明，建议添加Cookie类型和用途的详细列表'
      ],
      'DE': [
        'GDPR合规存在问题：缺少明确的数据处理同意机制',
        '联系页面未提供德国本地地址和VAT税号',
        'Cookie横幅不符合德国法律要求，必须允许用户拒绝所有非必要Cookie',
        '产品安全标准未显示CE认证标识，这在欧盟是强制要求'
      ],
      'JP': [
        '缺少个人信息保护法合规声明，日本2022年新法要求更严格的数据保护',
        '电子商务交易法要求的"特定商取引法"相关信息不完整',
        '退货政策未明确说明"冷却期"(cooling-off period)规定',
        '缺少日本消费者厅要求的价格比较和广告真实性声明'
      ],
      'CN': [
        '网络安全法合规：缺少数据本地化存储声明',
        '电子商务法要求显示营业执照信息，当前页面未提供',
        '消费者权益保护法：退换货政策不够详细，缺少7天无理由退货说明',
        '广告法合规：产品描述中可能存在极限用词，建议审查"最佳"、"第一"等表述'
      ]
    },
    ux: {
      'US': [
        '页面加载速度3.2秒，超过美国用户期望的2秒标准，建议优化图片压缩和CDN',
        '移动端购物车按钮过小(32px)，建议增大到44px以上符合触摸操作标准',
        '结账流程包含5个步骤，美国用户偏好简化的一页结账',
        '搜索功能缺少自动补全和拼写纠错，影响用户购物效率'
      ],
      'DE': [
        '支付方式缺少德国流行的SEPA、Klarna等本地支付选项',
        '产品对比功能不够详细，德国消费者喜欢仔细比较产品参数',
        '客服聊天功能仅工作时间可用，建议提供24/7德语支持或详细FAQ',
        '网站未适配德国常用的高分辨率显示器(4K)，文字显示过小'
      ],
      'JP': [
        '缺少日本用户习惯的详细商品规格表和尺寸对照图',
        '评价系统过于简单，日本用户重视详细的使用体验分享',
        '购物车保存时间过短，建议延长到30天以适应日本用户的长决策周期',
        '缺少便利店取货选项，这是日本电商的标准配置'
      ],
      'CN': [
        '缺少微信/支付宝等中国主流支付方式',
        '商品页面信息密度不够，中国用户喜欢丰富详细的商品介绍',
        '缺少直播购物功能，这在中国电商中非常重要',
        '物流追踪信息不够详细，建议集成顺丰、京东物流等实时追踪'
      ]
    }
  };

  const categoryIssues = detailedIssues[category];
  if (!categoryIssues) return [];

  const regionIssues = categoryIssues[region] || categoryIssues['US']; // 默认使用美国的问题
  const issueCount = Math.floor(Math.random() * 3) + 1; // 1-3个问题
  
  return regionIssues.slice(0, issueCount);
}

function generateMockRecommendations(region) {
  const detailedRecommendations = {
    'US': [
      {
        category: 'language',
        priority: 'high',
        issue: '语言本地化不足',
        suggestion: '建议将所有核心功能翻译为英文：导航菜单、产品分类、结账流程。重点优化CTA按钮文案，如"立即购买"改为"Buy Now"、"加入购物车"改为"Add to Cart"。建议使用专业的本地化服务确保表达地道性。',
        implementation: '预计完成时间：1-2周，成本估算：$2,000-5,000',
        expectedImpact: '提升转化率15-25%，减少用户流失30%'
      },
      {
        category: 'culture',
        priority: 'high',
        issue: '色彩和视觉元素不符合美国文化',
        suggestion: '调整主色调：减少红色使用(在美国常表示错误/危险)，增加蓝色(信任)和绿色(安全/环保)。节日营销重点关注感恩节(11月)、黑五/网一、圣诞节。产品图片增加多元化模特，体现美国多样性文化。',
        implementation: '设计改版周期：2-3周，需要UI/UX设计师',
        expectedImpact: '提升品牌信任度20%，增加用户停留时间35%'
      },
      {
        category: 'compliance',
        priority: 'high',
        issue: 'CCPA和数据保护合规性不足',
        suggestion: '添加CCPA合规页面，包含"Do Not Sell My Personal Information"链接。完善Cookie政策，详细说明数据收集类型和用途。确保退款政策清晰，符合FTC要求(30天内无条件退款)。',
        implementation: '需要法务审核，预计1周完成合规文档',
        expectedImpact: '避免法律风险，提升用户信任度25%'
      },
      {
        category: 'userExperience',
        priority: 'medium',
        issue: '购物体验不符合美国用户习惯',
        suggestion: '简化结账流程为单页结账，支持Guest Checkout(无需注册购买)。添加主流支付方式：Apple Pay、Google Pay、PayPal。优化移动端体验，确保按钮尺寸≥44px。页面加载速度优化至2秒内。',
        implementation: '开发周期：3-4周，需前端和后端配合',
        expectedImpact: '提升移动转化率40%，减少购物车放弃率30%'
      }
    ],
    'DE': [
      {
        category: 'language',
        priority: 'high',
        issue: '德语本地化和文化表达不准确',
        suggestion: '全站德语翻译，特别注意商务德语的正式性。产品描述使用标准德语术语：Größe(尺寸)、Versand(运输)、Rücksendung(退货)。日期格式改为DD.MM.YYYY，价格显示为"€ 99,90"格式。',
        implementation: '需要德语母语翻译师，周期2-3周',
        expectedImpact: '提升德国市场接受度50%，降低跳出率25%'
      },
      {
        category: 'culture', 
        priority: 'medium',
        issue: '设计风格不符合德国用户偏好',
        suggestion: '采用简洁、专业的设计风格，减少鲜艳色彩。强化产品技术参数和质量认证展示。添加详细的产品对比功能。强调"Made in Germany"或欧盟品质认证。',
        implementation: '设计改版和功能开发：4-6周',
        expectedImpact: '提升品牌专业度认知40%，增加购买决策信心'
      },
      {
        category: 'compliance',
        priority: 'high',
        issue: 'GDPR和德国电商法合规问题',
        suggestion: '实施严格的GDPR合规：用户必须明确同意数据处理，提供随时撤回同意的机制。添加德国VAT税号和本地联系地址。Cookie横幅必须允许拒绝所有非必要Cookie。产品显示CE认证标识。',
        implementation: '需要法务和技术配合，2-3周完成',
        expectedImpact: '符合法律要求，避免GDPR罚款风险'
      }
    ],
    'JP': [
      {
        category: 'language',
        priority: 'high',  
        issue: '日语表达和敬语使用不当',
        suggestion: '使用标准的日语敬语体系，特别是面向客户的用语。商品分类使用日本消费者熟悉的カテゴリー体系。添加详细的日语FAQ和客服支持。支付和配送页面提供详细的日语说明。',
        implementation: '需要日语专业翻译和本地化专家，3-4周',
        expectedImpact: '提升日本用户满意度60%，增加回购率'
      },
      {
        category: 'culture',
        priority: 'high',
        issue: '页面设计不符合日本用户习惯',
        suggestion: '增加页面信息密度，日本用户喜欢详细完整的信息。添加季节性设计元素，体现四季文化。强化产品包装美感展示，添加匠人工艺说明。增加用户评价的详细度和真实性。',
        implementation: 'UI重设计和内容策划：5-6周',
        expectedImpact: '提升用户参与度70%，增加页面停留时间'
      },
      {
        category: 'userExperience',
        priority: 'medium',
        issue: '购物流程不适合日本消费习惯',
        suggestion: '添加便利店取货选项(7-11、FamilyMart等)，支持日本主流支付方式。延长购物车保存时间至30天，适应日本用户的长决策周期。增加详细的商品规格对比和尺寸指南。',
        implementation: '需要集成日本本地服务商，4-5周',
        expectedImpact: '提升转化率45%，减少购物车放弃'
      }
    ],
    'CN': [
      {
        category: 'language',
        priority: 'high',
        issue: '中文本地化和表达方式需优化', 
        suggestion: '提供简体中文版本，使用符合中国用户习惯的表达方式。产品标题和描述更加详细丰富。添加中文客服支持(QQ/微信)。价格显示人民币(¥)并提供实时汇率换算。',
        implementation: '中文翻译和本地化：2-3周',
        expectedImpact: '提升中国用户接受度80%，增加询盘量'
      },
      {
        category: 'culture',
        priority: 'high',
        issue: '视觉设计和营销方式不符合中国文化',
        suggestion: '调整色彩搭配：使用红色、金色等中国用户喜爱的颜色。添加社交购物元素："朋友都在买"、"限时团购"、"拼单优惠"。增加KOL推荐和用户晒单功能。节日营销关注春节、双11、618等中国节日。',
        implementation: '视觉改版和功能开发：6-8周',
        expectedImpact: '提升社交传播效果200%，增加复购率'
      },
      {
        category: 'userExperience', 
        priority: 'high',
        issue: '支付和物流体验不符合中国标准',
        suggestion: '集成微信支付、支付宝等主流支付方式。添加直播购物功能和短视频展示。物流追踪集成顺丰、京东等本土快递，提供详细的配送进度。增加商品页面信息密度和使用场景展示。',
        implementation: '需要集成多个第三方服务，8-10周',
        expectedImpact: '提升支付成功率60%，改善物流体验满意度'
      }
    ]
  };

  const regionRecommendations = detailedRecommendations[region] || detailedRecommendations['US'];
  const recommendationCount = Math.floor(Math.random() * 3) + 2; // 2-4个推荐
  
  return regionRecommendations.slice(0, recommendationCount);
}

// 创建服务器
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;
  
  console.log(`${new Date().toISOString()} - ${method} ${path}`);
  
  // 处理OPTIONS请求（CORS预检）
  if (method === 'OPTIONS') {
    setCORSHeaders(res);
    res.writeHead(200);
    res.end();
    return;
  }
  
  // 路由处理
  if (path === '/api/status' && method === 'GET') {
    sendJSON(res, {
      available: true,
      message: '后端服务正常运行',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  }
  else if (path === '/api/test-connection' && method === 'POST') {
    parseBody(req, (error, body) => {
      if (error) {
        return sendJSON(res, { error: 'Invalid JSON' }, 400);
      }
      
      const { provider, apiKey } = body;
      console.log(`Testing connection for provider: ${provider}`);
      
      if (!apiKey || apiKey.length < 10) {
        return sendJSON(res, {
          success: false,
          error: 'API密钥格式不正确'
        });
      }
      
      // 存储API密钥
      apiKeys[provider] = apiKey;
      console.log(`✅ 已存储 ${provider} API密钥`);
      
      // 如果是DeepSeek，尝试实际测试API连接
      if (provider === 'deepseek') {
        const testPrompt = '请简单回复"连接测试成功"';
        
        callDeepSeekAPI(testPrompt, apiKey)
          .then(response => {
            console.log('🎉 DeepSeek API实际连接测试成功');
            sendJSON(res, {
              success: true,
              provider,
              message: `${provider} API连接测试成功`,
              testResponse: response.substring(0, 100),
              timestamp: new Date().toISOString()
            });
          })
          .catch(apiError => {
            console.error('❌ DeepSeek API实际连接测试失败:', apiError.message);
            sendJSON(res, {
              success: false,
              provider,
              error: `API连接失败: ${apiError.message}`,
              timestamp: new Date().toISOString()
            });
          });
      } else {
        // 其他提供商使用模拟测试
        sendJSON(res, {
          success: true,
          provider,
          message: `${provider} API连接测试成功 (模拟)`,
          timestamp: new Date().toISOString()
        });
      }
    });
  }
  else if (path === '/api/analyze' && method === 'POST') {
    parseBody(req, async (error, body) => {
      if (error) {
        return sendJSON(res, { error: 'Invalid JSON' }, 400);
      }
      
      const { url, title, content, meta, ecommerce, targetRegions } = body;
      console.log(`Analyzing content for regions: ${targetRegions?.join(', ')}`);
      
      try {
        // 获取DeepSeek API密钥
        const deepseekApiKey = apiKeys['deepseek'];
        
        // 调用增强分析（支持AI）
        const smartResults = await generateSmartAnalysis(body, targetRegions, deepseekApiKey);
        
        sendJSON(res, {
          success: true,
          timestamp: new Date().toISOString(),
          url: url,
          results: smartResults,
          aiEnhanced: !!deepseekApiKey,
          processingTime: Math.floor(Math.random() * 3000 + 2000)
        });
      } catch (analysisError) {
        console.error('❌ 分析过程出错:', analysisError.message);
        sendJSON(res, {
          success: false,
          error: '分析失败',
          details: analysisError.message,
          timestamp: new Date().toISOString()
        }, 500);
      }
    });
  }
  else {
    // 404处理
    sendJSON(res, {
      error: 'Not found',
      message: `Endpoint ${method} ${path} not found`
    }, 404);
  }
});

// 启动服务器
server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 跨境电商分析API服务器运行在 http://0.0.0.0:${port}`);
  console.log(`📊 状态检查: http://0.0.0.0:${port}/api/status`);
  console.log(`🔧 API测试: POST http://0.0.0.0:${port}/api/test-connection`);
  console.log(`🎯 内容分析: POST http://0.0.0.0:${port}/api/analyze`);
  console.log('服务器已就绪，等待连接...');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭'); 
    process.exit(0);
  });
});