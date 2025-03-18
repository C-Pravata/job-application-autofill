import SwiftUI

struct EducationListView: View {
    @ObservedObject private var dataManager = DataManager.shared
    @State private var showingAddForm = false
    @State private var editingEducation: Education?
    @State private var showingDeleteAlert = false
    @State private var educationToDelete: Int?
    
    var body: some View {
        VStack {
            if dataManager.educationHistory.isEmpty {
                emptyStateView
            } else {
                educationListView
            }
        }
        .navigationTitle("Education History")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showingAddForm = true }) {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $showingAddForm) {
            NavigationView {
                EducationFormView(education: Education())
                    .navigationTitle("Add Education")
                    .toolbar {
                        ToolbarItem(placement: .navigationBarLeading) {
                            Button("Cancel") {
                                showingAddForm = false
                            }
                        }
                    }
            }
        }
        .sheet(item: $editingEducation) { education in
            NavigationView {
                EducationFormView(education: education)
                    .navigationTitle("Edit Education")
                    .toolbar {
                        ToolbarItem(placement: .navigationBarLeading) {
                            Button("Cancel") {
                                editingEducation = nil
                            }
                        }
                    }
            }
        }
        .alert(isPresented: $showingDeleteAlert) {
            Alert(
                title: Text("Delete Education"),
                message: Text("Are you sure you want to delete this education record? This action cannot be undone."),
                primaryButton: .destructive(Text("Delete")) {
                    if let index = educationToDelete {
                        dataManager.deleteEducation(at: index)
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
            
            Image(systemName: "book")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            
            Text("No Education History")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("Add your education history to help fill out job applications automatically.")
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
                .padding(.horizontal)
            
            Button(action: { showingAddForm = true }) {
                Text("Add Education")
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
    
    private var educationListView: some View {
        List {
            ForEach(Array(dataManager.educationHistory.enumerated()), id: \.element.id) { index, education in
                EducationRow(education: education)
                    .contentShape(Rectangle())
                    .onTapGesture {
                        editingEducation = education
                    }
                    .contextMenu {
                        Button(action: {
                            editingEducation = education
                        }) {
                            Label("Edit", systemImage: "pencil")
                        }
                        
                        Button(action: {
                            educationToDelete = index
                            showingDeleteAlert = true
                        }) {
                            Label("Delete", systemImage: "trash")
                        }
                    }
            }
            .onDelete { indexSet in
                if let index = indexSet.first {
                    educationToDelete = index
                    showingDeleteAlert = true
                }
            }
        }
    }
}

// MARK: - Supporting Views

struct EducationRow: View {
    let education: Education
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(education.degreeAndFieldString)
                    .font(.headline)
                
                Spacer()
                
                if education.isCurrentEducation {
                    Text("Current")
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color.green.opacity(0.2))
                        .foregroundColor(.green)
                        .cornerRadius(4)
                }
            }
            
            Text(education.institution)
                .font(.subheadline)
            
            HStack {
                Text(education.location)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text(education.durationString)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.top, 2)
            
            if let gpa = education.gpa, !gpa.isEmpty {
                Text("GPA: \(gpa)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.top, 2)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Preview

struct EducationListView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            EducationListView()
        }
    }
} 