# TaskMaster - Cursor Development Brief

## Project Goal
Build an AI-powered project management tool that replaces Notion for HIVE development coordination. TaskMaster optimizes task assignment based on team skills, capacity, and OKRs while providing intelligent recommendations.

## Core Features
- **Smart Task Assignment:** AI suggests optimal person for each task based on skills/capacity
- **OKR Alignment:** Tasks automatically scored for strategic alignment  
- **Workload Balancing:** Real-time capacity monitoring and redistribution suggestions
- **Sprint Planning:** Intelligent sprint composition with 60% protocols, 30% clients, 10% infrastructure
- **Progress Tracking:** Automated bottleneck detection and timeline predictions

## Database Schema

### Tasks Table
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('protocol_core', 'client_implementation', 'integration', 'organizational')),
  protocol_id UUID REFERENCES protocols(id),
  client_id UUID REFERENCES clients(id),
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'review', 'done', 'blocked')),
  assignee_id UUID REFERENCES team_members(id),
  due_date DATE,
  estimated_hours INTEGER,
  sprint_goal TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Protocols Table
```sql
CREATE TABLE protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('planning', 'development', 'testing', 'production')),
  current_version TEXT,
  steward_id UUID REFERENCES team_members(id),
  health_score TEXT CHECK (health_score IN ('green', 'yellow', 'red'))
);
```

### Clients Table
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  implementation_status TEXT CHECK (implementation_status IN ('scoping', 'building', 'testing', 'live', 'maintained')),
  go_live_date DATE,
  revenue_potential TEXT CHECK (revenue_potential IN ('high', 'medium', 'low')),
  primary_contact TEXT
);
```

### Team Members Table
```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  skills JSONB, -- ["frontend", "ai", "coordination"]
  capacity_hours INTEGER DEFAULT 40,
  current_workload INTEGER DEFAULT 0,
  availability JSONB -- calendar integration data
);
```

### OKRs Table
```sql
CREATE TABLE okrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective TEXT NOT NULL,
  key_results JSONB,
  priority_weight DECIMAL(3,2), -- 0.0 to 1.0
  quarter TEXT,
  status TEXT CHECK (status IN ('active', 'completed', 'paused'))
);
```

## AI Features to Implement

### Basic Task Assignment Suggestions
```javascript
// Simple assignment scoring based on availability and skills
function suggestAssignment(task) {
  const availableMembers = teamMembers.filter(member => 
    member.currentWorkload + task.estimatedHours <= member.capacityHours &&
    member.skills.some(skill => task.requiredSkills.includes(skill))
  );
  
  return availableMembers.map(member => ({
    member,
    skillMatch: countMatchingSkills(member.skills, task.requiredSkills),
    workloadScore: (member.capacityHours - member.currentWorkload) / member.capacityHours
  })).sort((a, b) => (b.skillMatch + b.workloadScore) - (a.skillMatch + a.workloadScore));
}
```

### Workload Balance Alerts
```javascript
// Simple capacity monitoring
function checkWorkloadBalance() {
  const overloadedMembers = teamMembers.filter(member => 
    member.currentWorkload > member.capacityHours * 0.9
  );
  
  const underutilizedMembers = teamMembers.filter(member =>
    member.currentWorkload < member.capacityHours * 0.6
  );
  
  return { overloaded: overloadedMembers, underutilized: underutilizedMembers };
}
```

## Tech Stack
- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Real-time + Auth)
- **AI:** OpenAI API for task analysis and recommendations
- **Charts:** Recharts for capacity/progress visualization
- **State:** React Query for server state management

## Key Components to Build

### TaskBoard Component
- Kanban-style interface with drag-and-drop
- Real-time updates via Supabase subscriptions
- AI assignment suggestions overlay

### CapacityDashboard Component  
- Team workload visualization
- Overload warnings and redistribution suggestions
- Skills matrix and availability calendar

### SprintPlanner Component
- AI-assisted sprint composition
- Capacity allocation pie chart (60/30/10 split)
- OKR alignment scoring

### Analytics Dashboard Component
- Before/after baseline comparisons
- Trend tracking over time
- Team satisfaction surveys
- Efficiency gain measurements

### BaselineTracker Component
- Manual data entry for current state measurements
- Automated collection where possible (calendar API, Notion API)
- Progress tracking against targets
- Recommendation impact analysis

## Data Collection Strategy

### Pre-Development
1. **Time Tracking:** Everyone tracks coordination time manually for one week
2. **Sprint Analysis:** Analyze last 6 sprints in Notion for completion rates
3. **Team Survey:** Baseline satisfaction scores
4. **Meeting Audit:** Calculate actual coordination overhead

### During Development
1. **Iterative Testing:** Test each feature as it's built
2. **Feature Impact:** Measure each feature's baseline improvement
3. **User Adoption:** Track which features get used vs. ignored

### Post-Launch
1. **Full Comparison:** Complete baseline vs. TaskMaster performance
2. **ROI Calculation:** Time saved vs. development investment
3. **Team Satisfaction:** Post-implementation survey

## Additional Considerations

### Baseline Integration in UI
```javascript
// Add baseline comparison component
const BaselineComparison = ({ metric, currentValue, baselineValue }) => {
  const improvement = ((currentValue - baselineValue) / baselineValue) * 100;
  return (
    <div className="baseline-metric">
      <h4>{metric}</h4>
      <div className="values">
        <span>Baseline: {baselineValue}</span>
        <span>Current: {currentValue}</span>
        <span className={improvement > 0 ? 'positive' : 'negative'}>
          {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
        </span>
      </div>
    </div>
  );
};
```

### Automated Baseline Collection
```javascript
// Integration with existing tools for automatic baseline measurement
const collectBaselines = async () => {
  return {
    notionMetrics: await analyzeNotionWorkspace(),
    calendarMetrics: await analyzeCalendarTime(), 
    githubMetrics: await analyzeCommitPatterns(),
    teamFeedback: await collectSurveyData()
  };
};
```

## Sample Data Structure
```javascript
const sampleTask = {
  id: "uuid",
  title: "Implement VOX search optimization",
  type: "protocol_core",
  protocol: "VOX",
  status: "not_started",
  estimatedHours: 8,
  requiredSkills: ["react", "vector-search", "optimization"],
  okrAlignment: 0.85,
  deadline: "2025-06-15"
};

const sampleTeamMember = {
  id: "uuid", 
  name: "Alex Chen",
  skills: ["react", "vector-search", "ai", "optimization"],
  capacityHours: 40,
  currentWorkload: 32,
  skillLevels: { "react": 9, "vector-search": 7, "ai": 8 }
};
```

## Integration Requirements
- **Supabase Real-time:** Live task updates across team
- **OpenAI API:** Basic task analysis for simple assignment suggestions  
- **Calendar APIs:** Team availability and capacity planning

## Baseline Measurement & Success Metrics

### Current State Baselines (Notion Setup)
**Measure these BEFORE building TaskMaster:**

#### Task Assignment & Planning
- **Assignment Decision Time:** How long does it take to decide who should do a task?
- **Assignment Changes:** How often do task assignments get changed mid-sprint?
- **Planning Session Duration:** Time spent in weekly sprint planning meetings
- **Context Switching:** How often people work on multiple protocol/client types per day

#### Sprint Performance  
- **Sprint Completion Rate:** % of planned tasks actually completed
- **Deadline Adherence:** % of tasks completed by original due date
- **Scope Creep:** How often new tasks get added mid-sprint
- **Workload Distribution:** Variance in hours worked across team members

#### Coordination Overhead
- **Meeting Time:** Hours per week spent in coordination meetings
- **Status Updates:** Time spent asking/giving status updates
- **Information Seeking:** Time spent searching for project information
- **Decision Delays:** Average time from task creation to assignment

#### Team Satisfaction
- **Workload Satisfaction:** Team rating of workload balance (1-10)
- **Task-Skill Match:** Team rating of how well tasks match their skills (1-10)
- **Clarity Score:** Team rating of task clarity and context (1-10)
- **Autonomy Score:** Team rating of decision-making autonomy (1-10)

### Baseline Data Collection
```sql
-- Add baseline tracking table
CREATE TABLE baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  baseline_value DECIMAL,
  measurement_date DATE,
  measurement_method TEXT,
  notes TEXT
);

-- Example baseline records
INSERT INTO baselines VALUES 
('assignment_decision_time_minutes', 25, '2025-06-09', 'manual_tracking', 'Average time in sprint planning to assign tasks'),
('sprint_completion_rate', 0.73, '2025-06-09', 'notion_analysis', 'Last 4 sprints average'),
('meeting_hours_per_week', 8.5, '2025-06-09', 'calendar_analysis', 'Coordination meetings only');
```

### Target Improvements
| Metric | Current Baseline | TaskMaster Target | Improvement |
|--------|------------------|-------------------|-------------|
| Assignment Decision Time | [measure] mins | <5 mins | Simple suggestions |
| Sprint Completion Rate | [measure]% | >85% | Better capacity planning |
| Planning Meeting Duration | [measure] mins | <60 mins | Clear task overview |
| Workload Variance | [measure]% | <20% | Basic load balancing |
| Task-Skill Match Score | [measure]/10 | >7/10 | Skills-based suggestions |
| Information Seeking Time | [measure] hrs/week | <2 hrs/week | Centralized task info |

## MVP Features
1. Basic task CRUD with database
2. Team capacity tracking  
3. Simple assignment suggestions based on skills and availability
4. Sprint kanban board
5. Basic workload balance alerts

## Advanced Features
1. Real-time collaboration
2. Enhanced assignment recommendations
3. Skills gap identification  
4. Integration with external tools