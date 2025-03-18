import SwiftUI

struct ContentView: View {
    @StateObject private var dataManager = DataManager.shared
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Dashboard Tab
            NavigationView {
                DashboardView()
                    .navigationTitle("Dashboard")
            }
            .tabItem {
                Label("Dashboard", systemImage: "house.fill")
            }
            .tag(0)
            
            // Profile Tab
            NavigationView {
                ProfileView()
                    .navigationTitle("Profile")
            }
            .tabItem {
                Label("Profile", systemImage: "person.fill")
            }
            .tag(1)
            
            // Employment Tab
            NavigationView {
                EmploymentListView()
                    .navigationTitle("Employment")
            }
            .tabItem {
                Label("Employment", systemImage: "briefcase.fill")
            }
            .tag(2)
            
            // Education Tab
            NavigationView {
                EducationListView()
                    .navigationTitle("Education")
            }
            .tabItem {
                Label("Education", systemImage: "book.fill")
            }
            .tag(3)
            
            // Documents Tab
            NavigationView {
                DocumentsView()
                    .navigationTitle("Documents")
            }
            .tabItem {
                Label("Documents", systemImage: "doc.fill")
            }
            .tag(4)
            
            // Autofill Tab
            NavigationView {
                AutofillView()
                    .navigationTitle("Autofill")
            }
            .tabItem {
                Label("Autofill", systemImage: "square.and.pencil")
            }
            .tag(5)
        }
        .accentColor(.blue)
    }
}

// MARK: - Preview
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}

// Placeholder views - these will be implemented in separate files
struct DashboardView: View {
    var body: some View {
        Text("Dashboard View")
            .padding()
    }
}

struct ProfileView: View {
    var body: some View {
        Text("Profile View")
            .padding()
    }
}

struct EmploymentListView: View {
    var body: some View {
        Text("Employment List View")
            .padding()
    }
}

struct EducationListView: View {
    var body: some View {
        Text("Education List View")
            .padding()
    }
}

struct DocumentsView: View {
    var body: some View {
        Text("Documents View")
            .padding()
    }
}

struct AutofillView: View {
    var body: some View {
        Text("Autofill View")
            .padding()
    }
} 