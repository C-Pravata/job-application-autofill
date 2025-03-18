import SwiftUI

struct EmploymentListView: View {
    @ObservedObject private var dataManager = DataManager.shared
    @State private var showingAddForm = false
    @State private var editingEmployment: Employment?
    @State private var showingDeleteAlert = false
    @State private var employmentToDelete: Int?
    
    var body: some View {
        VStack {
            if dataManager.employmentHistory.isEmpty {
                emptyStateView
            } else {
                employmentListView
            }
        }
        .navigationTitle("Employment History")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showingAddForm = true }) {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $showingAddForm) {
            NavigationView {
                EmploymentFormView(employment: Employment())
                    .navigationTitle("Add Employment")
                    .toolbar {
                        ToolbarItem(placement: .navigationBarLeading) {
                            Button("Cancel") {
                                showingAddForm = false
                            }
                        }
                    }
            }
        }
        .sheet(item: $editingEmployment) { employment in
            NavigationView {
                EmploymentFormView(employment: employment)
                    .navigationTitle("Edit Employment")
                    .toolbar {
                        ToolbarItem(placement: .navigationBarLeading) {
                            Button("Cancel") {
                                editingEmployment = nil
                            }
                        }
                    }
            }
        }
        .alert(isPresented: $showingDeleteAlert) {
            Alert(
                title: Text("Delete Employment"),
                message: Text("Are you sure you want to delete this employment record? This action cannot be undone."),
                primaryButton: .destructive(Text("Delete")) {
                    if let index = employmentToDelete {
                        dataManager.deleteEmployment(at: index)
                    }
                },
                secondaryButton: .cancel()
            )
        }
    }
    
    // MARK: - Views
    
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Spacer()
            
            Image(systemName: "briefcase")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            
            Text("No Employment History")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("Add your work experience to help fill out job applications automatically.")
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
                .padding(.horizontal)
            
            Button(action: { showingAddForm = true }) {
                Text("Add Employment")
                    .fontWeight(.semibold)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(8)
            }
            .padding(.top)
            
            Spacer()
        }
        .padding()
    }
    
    private var employmentListView: some View {
        List {
            ForEach(Array(dataManager.employmentHistory.enumerated()), id: \.element.id) { index, employment in
                EmploymentRow(employment: employment)
                    .contentShape(Rectangle())
                    .onTapGesture {
                        editingEmployment = employment
                    }
                    .contextMenu {
                        Button(action: {
                            editingEmployment = employment
                        }) {
                            Label("Edit", systemImage: "pencil")
                        }
                        
                        Button(action: {
                            employmentToDelete = index
                            showingDeleteAlert = true
                        }) {
                            Label("Delete", systemImage: "trash")
                        }
                    }
            }
            .onDelete { indexSet in
                if let index = indexSet.first {
                    employmentToDelete = index
                    showingDeleteAlert = true
                }
            }
        }
    }
}

// MARK: - Supporting Views

struct EmploymentRow: View {
    let employment: Employment
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(employment.jobTitle)
                    .font(.headline)
                
                Spacer()
                
                if employment.isCurrentJob {
                    Text("Current")
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color.green.opacity(0.2))
                        .foregroundColor(.green)
                        .cornerRadius(4)
                }
            }
            
            Text(employment.company)
                .font(.subheadline)
            
            HStack {
                Text(employment.location)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text(employment.durationString)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.top, 2)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Preview

struct EmploymentListView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            EmploymentListView()
        }
    }
} 