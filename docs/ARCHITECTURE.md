# 🏗️ System Architecture

This document provides a comprehensive overview of HackHub's system architecture, including high-level design patterns, data flow, and technical decisions.

## Overview

HackHub is built as a modern, scalable web application using a jamstack architecture with real-time capabilities. The system is designed to handle concurrent users across multiple hackathons while maintaining performance and data consistency.

## System Architecture Diagram

```mermaid
architecture-beta
    group frontend(cloud)[Frontend Layer]
    group backend(cloud)[Backend Layer]
    group data(database)[Data Layer]
    group features(server)[Feature Modules]

    service spa(server)[React SPA] in frontend
    service auth(server)[Auth Service] in backend
    service api(server)[API Gateway] in backend
    service realtime(server)[Realtime Engine] in backend
    service db(database)[PostgreSQL] in data
    service storage(disk)[File Storage] in data
    service cache(disk)[Cache Layer] in data
    
    service teams(server)[Team Management] in features
    service ideas(server)[Ideas Board] in features
    service projects(server)[Project System] in features
    service collaboration(server)[Collaboration Tools] in features

    spa:B --> T:auth
    spa:B --> T:api
    spa:B --> T:realtime
    auth:B --> T:db
    api:B --> T:db
    realtime:B --> T:db
    api:R --> L:storage
    api:R --> L:cache
    api:B --> T:teams
    api:B --> T:ideas
    api:B --> T:projects
    api:B --> T:collaboration
    teams:B --> T:db
    ideas:B --> T:db
    projects:B --> T:db
    collaboration:B --> T:db
```

## Frontend Architecture

### Component Architecture

```mermaid
classDiagram
    class App {
        +Router
        +ThemeProvider
        +AuthProvider
        +RealtimeProvider
        +render()
    }
    
    class Layout {
        +Header
        +Sidebar
        +MainContent
        +Navigation
        +render()
    }
    
    class HackathonManager {
        +createHackathon()
        +editHackathon()
        +deleteHackathon()
        +listHackathons()
        +joinHackathon()
        +manageParticipants()
    }
    
    class TeamManager {
        +createTeam()
        +editTeam()
        +joinTeam()
        +leaveTeam()
        +manageMembers()
        +teamCollaboration()
    }
    
    class IdeasBoard {
        +submitIdea()
        +editIdea()
        +voteOnIdea()
        +commentOnIdea()
        +filterIdeas()
        +categoryManagement()
    }
    
    class ProjectSystem {
        +manageRepository()
        +manageDemoURL()
        +manageAttachments()
        +projectShowcase()
        +fileManagement()
    }
    
    class CollaborationTools {
        +teamChat()
        +fileSharing()
        +videoCall()
        +realTimeUpdates()
        +notifications()
    }
    
    class AuthStore {
        +user: User
        +session: Session
        +login()
        +logout()
        +updateProfile()
        +manageRoles()
    }
    
    class HackathonStore {
        +hackathons: Hackathon[]
        +teams: Team[]
        +ideas: Idea[]
        +fetchHackathons()
        +createTeam()
        +joinTeam()
        +updateTeam()
    }
    
    class ProjectAttachments {
        +repositoryUrl: string
        +demoUrl: string
        +attachments: ProjectAttachment[]
        +addAttachment()
        +removeAttachment()
        +validateUrls()
    }
    
    class TeamChatNew {
        +messages: Message[]
        +sendMessage()
        +receiveMessage()
        +realTimeSync()
    }
    
    class TeamFileManagerNew {
        +files: FileUpload[]
        +uploadFile()
        +downloadFile()
        +shareFile()
        +deleteFile()
    }
    
    class TeamVideoCall {
        +roomId: string
        +participants: User[]
        +startCall()
        +endCall()
        +shareScreen()
    }

    App --> Layout
    Layout --> HackathonManager
    Layout --> TeamManager
    Layout --> IdeasBoard
    Layout --> ProjectSystem
    Layout --> CollaborationTools
    
    HackathonManager --> AuthStore
    HackathonManager --> HackathonStore
    TeamManager --> HackathonStore
    TeamManager --> ProjectAttachments
    TeamManager --> TeamChatNew
    TeamManager --> TeamFileManagerNew
    TeamManager --> TeamVideoCall
    IdeasBoard --> HackathonStore
    IdeasBoard --> ProjectAttachments
    ProjectSystem --> ProjectAttachments
    CollaborationTools --> TeamChatNew
    CollaborationTools --> TeamFileManagerNew
    CollaborationTools --> TeamVideoCall
```

### State Management Architecture

```mermaid
classDiagram
    class AuthStore {
        +user: User
        +session: Session
        +login()
        +logout()
        +updateProfile()
    }
    
    class HackathonStore {
        +hackathons: Hackathon[]
        +currentHackathon: Hackathon
        +fetchHackathons()
        +createHackathon()
        +updateHackathon()
    }
    
    class TeamStore {
        +teams: Team[]
        +currentTeam: Team
        +members: User[]
        +joinTeam()
        +leaveTeam()
        +updateTeam()
    }
    
    class NotificationStore {
        +notifications: Notification[]
        +unreadCount: number
        +markAsRead()
        +subscribe()
        +unsubscribe()
    }
    
    AuthStore --> HackathonStore
    AuthStore --> TeamStore
    AuthStore --> NotificationStore
```

## Backend Architecture

### Supabase Services

```mermaid
classDiagram
    class SupabaseAuth {
        +signUp()
        +signIn()
        +signOut()
        +updateUser()
        +resetPassword()
    }
    
    class SupabaseDatabase {
        +executeQuery()
        +executeTransaction()
        +subscribeToChanges()
        +enforceRLS()
    }
    
    class SupabaseStorage {
        +uploadFile()
        +downloadFile()
        +deleteFile()
        +generateSignedUrl()
    }
    
    class SupabaseRealtime {
        +subscribeToTable()
        +broadcastEvent()
        +handleConnection()
        +manageChannels()
    }
    
    SupabaseAuth --> SupabaseDatabase
    SupabaseDatabase --> SupabaseStorage
    SupabaseDatabase --> SupabaseRealtime
```

## Data Architecture

### Enhanced Database Schema

```mermaid
erDiagram
    HACKATHONS {
        uuid id PK
        string title
        text description
        timestamp start_date
        timestamp end_date
        int max_team_size
        int allowed_participants
        string registration_key
        json tags
        json prizes
        text rules
        string banner_url
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }

    PROFILES {
        uuid id PK
        string name
        string email
        string role
        json skills
        string avatar_url
        text bio
        timestamp created_at
        timestamp updated_at
    }

    TEAMS {
        uuid id PK
        string name
        text description
        uuid hackathon_id FK
        uuid created_by FK
        boolean is_open
        json skills
        string avatar_url
        timestamp created_at
        timestamp updated_at
    }

    TEAM_MEMBERS {
        uuid id PK
        uuid team_id FK
        uuid user_id FK
        string role
        timestamp joined_at
    }

    IDEAS {
        uuid id PK
        string title
        text description
        uuid hackathon_id FK
        uuid team_id FK
        uuid created_by FK
        string category
        json tags
        int votes
        string status
        json attachments
        string repository_url
        string demo_url
        text project_attachments
        timestamp created_at
        timestamp updated_at
    }

    IDEA_VOTES {
        uuid id PK
        uuid idea_id FK
        uuid user_id FK
        timestamp created_at
    }

    IDEA_COMMENTS {
        uuid id PK
        uuid idea_id FK
        uuid user_id FK
        text content
        timestamp created_at
        timestamp updated_at
    }

    HACKATHON_PARTICIPANTS {
        uuid id PK
        uuid hackathon_id FK
        uuid user_id FK
        timestamp joined_at
    }

    TEAM_MESSAGES {
        uuid id PK
        uuid team_id FK
        uuid user_id FK
        text content
        json attachments
        timestamp created_at
    }

    TEAM_FILES {
        uuid id PK
        uuid team_id FK
        uuid uploaded_by FK
        string filename
        string file_url
        int file_size
        string mime_type
        timestamp created_at
    }

    HACKATHONS ||--o{ TEAMS : "contains"
    HACKATHONS ||--o{ IDEAS : "hosts"
    HACKATHONS ||--o{ HACKATHON_PARTICIPANTS : "has"
    PROFILES ||--o{ TEAMS : "creates"
    PROFILES ||--o{ TEAM_MEMBERS : "member_of"
    PROFILES ||--o{ IDEAS : "submits"
    PROFILES ||--o{ IDEA_VOTES : "votes"
    PROFILES ||--o{ IDEA_COMMENTS : "comments"
    PROFILES ||--o{ HACKATHON_PARTICIPANTS : "participates"
    PROFILES ||--o{ TEAM_MESSAGES : "sends"
    PROFILES ||--o{ TEAM_FILES : "uploads"
    TEAMS ||--o{ TEAM_MEMBERS : "has"
    TEAMS ||--o{ IDEAS : "develops"
    TEAMS ||--o{ TEAM_MESSAGES : "exchanges"
    TEAMS ||--o{ TEAM_FILES : "manages"
    IDEAS ||--o{ IDEA_VOTES : "receives"
    IDEAS ||--o{ IDEA_COMMENTS : "has"
```

### Key Schema Enhancements

#### Project Data Integration
- **`repository_url`**: Direct storage of GitHub/GitLab repository URLs
- **`demo_url`**: Live demo or deployed project URLs  
- **`project_attachments`**: JSON field storing ProjectAttachment objects with screenshots, additional repos, and demo links

#### Team Collaboration Features
- **`TEAM_MESSAGES`**: Real-time chat functionality with attachment support
- **`TEAM_FILES`**: File sharing and management within teams
- **Role-based access**: Team leaders vs members with different permissions

#### Enhanced User Experience
- **Skill-based matching**: JSON arrays for flexible skill management
- **Comprehensive voting**: Dedicated vote tracking with user association
- **Activity tracking**: Detailed timestamps and user attribution

## Security Architecture

### Row Level Security (RLS) Policies

```mermaid
classDiagram
    class RLSPolicy {
        <<interface>>
        +table string
        +operation string
        +condition string
        +enforce()
    }
    
    class UserPolicy {
        +table string
        +operation string
        +condition string
        +enforce()
    }
    
    class HackathonPolicy {
        +table string
        +operation string
        +condition string
        +enforce()
    }
    
    class TeamPolicy {
        +table string
        +operation string
        +condition string
        +enforce()
    }
    
    class IdeaPolicy {
        +table string
        +operation string
        +condition string
        +enforce()
    }
    
    RLSPolicy <|-- UserPolicy
    RLSPolicy <|-- HackathonPolicy
    RLSPolicy <|-- TeamPolicy
    RLSPolicy <|-- IdeaPolicy
```

## Data Flow Architecture

### Team Creation and Project Management Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant TS as TeamService
    participant IS as IdeaService
    participant DB as Database
    participant R as Realtime

    Note over U,R: Team Creation with Project Integration

    U->>F: Navigate to Teams page
    F->>F: Select hackathon (required)
    U->>F: Click "Create Team"
    F->>F: Open team creation modal

    U->>F: Fill team details (name, description, skills)
    U->>F: Fill idea details (title, description, category)
    U->>F: Add project data (repository URL, demo URL)
    U->>F: Add project attachments (screenshots, links)
    U->>F: Submit form

    F->>F: Validate form data
    F->>TS: createTeam(teamData)
    TS->>DB: INSERT team record
    DB-->>TS: Return team with ID

    alt If idea provided
        F->>IS: createIdea(ideaData with project fields)
        IS->>DB: INSERT idea with repository_url, demo_url, project_attachments
        DB-->>IS: Return created idea
        IS-->>F: Idea created successfully
    end

    TS-->>F: Team created successfully
    F->>R: Broadcast team creation
    R->>DB: Log activity
    F->>F: Show success notification
    F->>F: Refresh teams list
    F-->>U: Display updated teams

    Note over U,R: Team Editing with Project Updates

    U->>F: Click edit team button
    F->>IS: getTeamIdeas(teamId)
    IS->>DB: SELECT ideas WHERE team_id
    DB-->>IS: Return team ideas
    IS-->>F: Return ideas with project data

    F->>F: Parse project data from database fields
    F->>F: Populate edit form with team + project data
    F-->>U: Show edit modal with all data

    U->>F: Modify team/idea/project information
    U->>F: Submit updates

    F->>TS: updateTeam(teamId, teamUpdates)
    TS->>DB: UPDATE teams SET ...
    DB-->>TS: Team updated

    alt If idea data provided
        F->>IS: updateIdea(ideaId, ideaUpdates + projectData)
        IS->>DB: UPDATE ideas SET repository_url, demo_url, project_attachments
        DB-->>IS: Idea updated with project data
        IS-->>F: Project data saved
    end

    F->>R: Broadcast team update
    F->>F: Show success notification
    F->>F: Refresh data
    F-->>U: Updated team displayed

    Note over U,R: Team Collaboration Features

    U->>F: Open team details
    F->>F: Check team membership
    
    alt If team member
        F->>F: Show collaboration tabs
        U->>F: Access team chat
        U->>F: Access file sharing
        U->>F: Access video calls
        F->>R: Real-time sync for all features
    else If not team member
        F->>F: Show join team option
        F-->>U: Limited view with join button
    end
```

### Team Formation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant D as Database
    participant R as Realtime
    participant T as Team Members
    
    U->>F: Create/Join team
    F->>D: Insert team/member record
    D->>R: Broadcast team update
    R->>T: Notify team members
    D->>F: Return updated team
    F->>U: Update team display
```

## Performance Architecture

### Caching Strategy

```mermaid
classDiagram
    class CacheStrategy {
        <<interface>>
        +key string
        +ttl number
        +get()
        +set()
        +invalidate()
    }
    
    class QueryCache {
        +key string
        +ttl number
        +strategy string
        +get()
        +set()
        +invalidate()
    }
    
    class UserCache {
        +key string
        +ttl number
        +strategy string
        +get()
        +set()
        +invalidate()
    }
    
    class StaticCache {
        +key string
        +ttl number
        +strategy string
        +get()
        +set()
        +invalidate()
    }
    
    CacheStrategy <|-- QueryCache
    CacheStrategy <|-- UserCache
    CacheStrategy <|-- StaticCache
```

### Real-time Updates

```mermaid
sequenceDiagram
    participant C1 as Client 1
    participant S as Supabase
    participant C2 as Client 2
    participant C3 as Client 3
    
    C1->>S: Update data
    S->>S: Save to database
    S->>C2: Real-time notification
    S->>C3: Real-time notification
    C2->>C2: Update local state
    C3->>C3: Update local state
```

## Deployment Architecture

### Development Environment

```mermaid
architecture-beta
    group dev(cloud)[Development]
    
    service local(server)[Local Server] in dev
    service supabase(database)[Supabase Local] in dev
    service vite(server)[Vite Dev Server] in dev
    
    vite:B --> T:local
    local:R --> L:supabase
```

### Production Environment

```mermaid
architecture-beta
    group cdn(cloud)[CDN Layer]
    group app(cloud)[Application Layer]
    group db(cloud)[Database Layer]
    
    service cloudflare(server)[Cloudflare] in cdn
    service vercel(server)[Vercel] in app
    service supabase_prod(database)[Supabase] in db
    service storage_prod(disk)[Storage] in db
    
    cloudflare:B --> T:vercel
    vercel:B --> T:supabase_prod
    vercel:R --> L:storage_prod
```

## Technology Stack Details

### Frontend Stack

- **React 18**: Modern React with concurrent features
- **TypeScript**: Type safety and developer experience
- **Vite**: Fast build tool and development server
- **Mantine v7**: Comprehensive UI component library
- **Zustand**: Lightweight state management
- **React Query**: Server state management and caching
- **React Hook Form**: Form handling and validation
- **Zod**: Runtime type validation

### Backend Stack

- **Supabase**: Backend-as-a-Service platform
- **PostgreSQL**: Primary database with JSON support
- **Row Level Security**: Database-level authorization
- **Supabase Auth**: Authentication and user management
- **Supabase Realtime**: WebSocket-based real-time updates
- **Supabase Storage**: File storage and CDN

### Development Tools

- **ESLint**: Code linting and quality assurance
- **Prettier**: Code formatting
- **TypeScript Compiler**: Static type checking
- **Supabase CLI**: Local development and migrations

## Key Architectural Decisions

### 1. Frontend-First Architecture

**Decision**: Build as a Single Page Application (SPA) with client-side routing.

**Rationale**: 
- Better user experience with instant navigation
- Reduced server load
- Easier to implement real-time features
- Better caching strategies

### 2. Supabase as Backend

**Decision**: Use Supabase instead of custom backend.

**Rationale**:
- Rapid development and deployment
- Built-in authentication and authorization
- Real-time capabilities out of the box
- Automatic API generation
- Managed infrastructure and scaling

### 3. Component-Based Architecture

**Decision**: Use Mantine component library with custom extensions.

**Rationale**:
- Consistent design system
- Accessibility built-in
- Reduced development time
- Professional appearance
- Customization capabilities

### 4. State Management Strategy

**Decision**: Hybrid approach with Zustand for global state and React Query for server state.

**Rationale**:
- Separation of concerns
- Optimistic updates
- Automatic caching and invalidation
- Reduced boilerplate
- Better developer experience

### 5. Real-time Architecture

**Decision**: Use Supabase Realtime for live updates.

**Rationale**:
- Native PostgreSQL integration
- Row-level subscriptions
- Automatic scaling
- Built-in authentication
- Reduced complexity

## Scalability Considerations

### Horizontal Scaling

- **Database**: Supabase handles read replicas and connection pooling
- **Frontend**: Static assets served via CDN
- **Real-time**: Supabase Realtime scales automatically

### Performance Optimizations

- **Code Splitting**: Route-based lazy loading
- **Bundle Optimization**: Tree shaking and dead code elimination
- **Image Optimization**: Responsive images and lazy loading
- **Caching**: Aggressive caching for static assets
- **Database**: Indexed queries and optimized schemas

### Monitoring and Observability

- **Error Tracking**: Client-side error monitoring
- **Performance Monitoring**: Core Web Vitals tracking
- **Database Monitoring**: Supabase built-in monitoring
- **User Analytics**: Usage patterns and performance metrics

## Security Considerations

### Authentication Security

- **JWT Tokens**: Secure token-based authentication
- **Session Management**: Automatic token refresh
- **Password Security**: Strong password requirements
- **Account Security**: Email verification and password reset

### Data Security

- **Row Level Security**: Database-level access control
- **Input Validation**: Client and server-side validation
- **XSS Prevention**: Content sanitization
- **CSRF Protection**: Built-in protection mechanisms

### Infrastructure Security

- **HTTPS Only**: All communications encrypted
- **Environment Variables**: Secure configuration management
- **API Keys**: Proper key management and rotation
- **Access Control**: Role-based permissions

## Future Architecture Considerations

### Microservices Migration

As the platform grows, consider migrating to microservices:
- **User Service**: Authentication and profile management
- **Hackathon Service**: Event management
- **Team Service**: Team formation and collaboration
- **Notification Service**: Real-time notifications

### Advanced Features

- **Search Service**: Elasticsearch for advanced search
- **Analytics Service**: Advanced reporting and insights
- **File Processing**: Background job processing
- **Email Service**: Transactional email handling

### Mobile Architecture

- **React Native**: Cross-platform mobile development
- **Shared Business Logic**: Code reuse between web and mobile
- **Offline Support**: Local data caching and synchronization
- **Push Notifications**: Native mobile notifications

---

This architecture provides a solid foundation for a scalable, maintainable, and performant hackathon management platform while maintaining flexibility for future enhancements and growth.
