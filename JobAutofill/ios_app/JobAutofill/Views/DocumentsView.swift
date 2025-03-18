import SwiftUI
import UniformTypeIdentifiers

struct DocumentsView: View {
    @ObservedObject private var dataManager = DataManager.shared
    @State private var showingDocumentPicker = false
    @State private var documentType = "resume" // Default type
    @State private var showingDeleteAlert = false
    @State private var documentToDelete: Int?
    @State private var isShowingPreview = false
    @State private var previewURL: URL?
    
    var body: some View {
        VStack {
            if dataManager.documents.isEmpty {
                emptyStateView
            } else {
                documentListView
            }
        }
        .navigationTitle("Documents")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button(action: {
                        documentType = "resume"
                        showingDocumentPicker = true
                    }) {
                        Label("Upload Resume", systemImage: "doc.text")
                    }
                    
                    Button(action: {
                        documentType = "coverLetter"
                        showingDocumentPicker = true
                    }) {
                        Label("Upload Cover Letter", systemImage: "doc")
                    }
                    
                    Button(action: {
                        documentType = "other"
                        showingDocumentPicker = true
                    }) {
                        Label("Upload Other Document", systemImage: "doc.fill")
                    }
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $showingDocumentPicker) {
            DocumentPicker(documentType: documentType)
        }
        .alert(isPresented: $showingDeleteAlert) {
            Alert(
                title: Text("Delete Document"),
                message: Text("Are you sure you want to delete this document? This action cannot be undone."),
                primaryButton: .destructive(Text("Delete")) {
                    if let index = documentToDelete {
                        dataManager.deleteDocument(at: index)
                    }
                },
                secondaryButton: .cancel()
            )
        }
        .sheet(isPresented: $isShowingPreview) {
            if let url = previewURL {
                DocumentPreviewView(url: url)
            }
        }
    }
    
    // MARK: - Views
    
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Spacer()
            
            Image(systemName: "doc.fill")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            
            Text("No Documents")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("Upload your resume and cover letter to help fill out job applications automatically.")
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
                .padding(.horizontal)
            
            HStack(spacing: 15) {
                Button(action: {
                    documentType = "resume"
                    showingDocumentPicker = true
                }) {
                    VStack {
                        Image(systemName: "doc.text")
                            .font(.title)
                            .padding(.bottom, 5)
                        
                        Text("Upload Resume")
                            .fontWeight(.medium)
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(8)
                }
                
                Button(action: {
                    documentType = "coverLetter"
                    showingDocumentPicker = true
                }) {
                    VStack {
                        Image(systemName: "doc")
                            .font(.title)
                            .padding(.bottom, 5)
                        
                        Text("Upload Cover Letter")
                            .fontWeight(.medium)
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(8)
                }
            }
            .padding(.top)
            
            Spacer()
        }
        .padding()
    }
    
    private var documentListView: some View {
        List {
            // Resumes Section
            Section(header: Text("Resumes")) {
                let resumes = dataManager.documents.filter { $0.type == "resume" }
                
                if resumes.isEmpty {
                    Button(action: {
                        documentType = "resume"
                        showingDocumentPicker = true
                    }) {
                        Text("Upload Resume")
                            .foregroundColor(.blue)
                    }
                } else {
                    ForEach(Array(resumes.enumerated()), id: \.element.id) { index, document in
                        documentRow(document: document, globalIndex: dataManager.documents.firstIndex(where: { $0.id == document.id }) ?? 0)
                    }
                }
            }
            
            // Cover Letters Section
            Section(header: Text("Cover Letters")) {
                let coverLetters = dataManager.documents.filter { $0.type == "coverLetter" }
                
                if coverLetters.isEmpty {
                    Button(action: {
                        documentType = "coverLetter"
                        showingDocumentPicker = true
                    }) {
                        Text("Upload Cover Letter")
                            .foregroundColor(.blue)
                    }
                } else {
                    ForEach(Array(coverLetters.enumerated()), id: \.element.id) { index, document in
                        documentRow(document: document, globalIndex: dataManager.documents.firstIndex(where: { $0.id == document.id }) ?? 0)
                    }
                }
            }
            
            // Other Documents Section
            let otherDocs = dataManager.documents.filter { $0.type == "other" }
            if !otherDocs.isEmpty {
                Section(header: Text("Other Documents")) {
                    ForEach(Array(otherDocs.enumerated()), id: \.element.id) { index, document in
                        documentRow(document: document, globalIndex: dataManager.documents.firstIndex(where: { $0.id == document.id }) ?? 0)
                    }
                }
            }
        }
    }
    
    private func documentRow(document: Document, globalIndex: Int) -> some View {
        HStack {
            // Document icon
            Image(systemName: document.iconName)
                .font(.title2)
                .foregroundColor(.blue)
                .frame(width: 40, height: 40)
            
            // Document info
            VStack(alignment: .leading, spacing: 4) {
                Text(document.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text(document.originalFilename)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Text("Uploaded \(document.formattedUploadDate)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // Default badge if applicable
            if document.isDefault {
                Text("Default")
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(Color.green.opacity(0.2))
                    .foregroundColor(.green)
                    .cornerRadius(4)
            }
        }
        .contentShape(Rectangle())
        .onTapGesture {
            previewURL = document.fileURL
            isShowingPreview = true
        }
        .contextMenu {
            Button(action: {
                previewURL = document.fileURL
                isShowingPreview = true
            }) {
                Label("Preview", systemImage: "eye")
            }
            
            Button(action: {
                // Set as default
                var updatedDoc = document
                updatedDoc.isDefault = true
                
                // Update other documents of the same type
                for (index, doc) in dataManager.documents.enumerated() {
                    if doc.type == document.type && doc.id != document.id && doc.isDefault {
                        var updatedOtherDoc = doc
                        updatedOtherDoc.isDefault = false
                        dataManager.documents[index] = updatedOtherDoc
                    }
                }
                
                // Update this document
                if let index = dataManager.documents.firstIndex(where: { $0.id == document.id }) {
                    dataManager.documents[index] = updatedDoc
                }
                
                // Save changes
                dataManager.saveDocuments()
            }) {
                Label("Set as Default", systemImage: "star")
            }
            
            Button(action: {
                documentToDelete = globalIndex
                showingDeleteAlert = true
            }) {
                Label("Delete", systemImage: "trash")
            }
        }
    }
}

// MARK: - Document Picker

struct DocumentPicker: UIViewControllerRepresentable {
    @ObservedObject private var dataManager = DataManager.shared
    @Environment(\.presentationMode) private var presentationMode
    
    let documentType: String
    
    func makeUIViewController(context: Context) -> UIDocumentPickerViewController {
        // Define allowed document types
        let supportedTypes: [UTType] = [
            .pdf,
            .plainText,
            .rtf,
            .docx,
            .doc,
            .image
        ]
        
        // Create document picker
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: supportedTypes)
        picker.allowsMultipleSelection = false
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIDocumentPickerViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIDocumentPickerDelegate {
        let parent: DocumentPicker
        
        init(_ parent: DocumentPicker) {
            self.parent = parent
        }
        
        func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
            guard let url = urls.first else { return }
            
            // Create a unique filename
            let uniqueFilename = UUID().uuidString + "." + url.pathExtension
            
            // Get the app's document directory
            guard let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else {
                return
            }
            
            // Create destination URL
            let destinationURL = documentsDirectory.appendingPathComponent(uniqueFilename)
            
            do {
                // Copy the file to the app's document directory
                if FileManager.default.fileExists(atPath: destinationURL.path) {
                    try FileManager.default.removeItem(at: destinationURL)
                }
                try FileManager.default.copyItem(at: url, to: destinationURL)
                
                // Create document object
                let document = Document(
                    name: nameForDocumentType(parent.documentType),
                    type: parent.documentType,
                    fileURL: destinationURL,
                    originalFilename: url.lastPathComponent,
                    uploadDate: Date(),
                    isDefault: isFirstOfType(parent.documentType)
                )
                
                // Add to data manager
                parent.dataManager.addDocument(document)
                
                // Dismiss picker
                parent.presentationMode.wrappedValue.dismiss()
            } catch {
                print("Error copying document: \(error)")
            }
        }
        
        private func nameForDocumentType(_ type: String) -> String {
            switch type {
            case "resume":
                return "My Resume"
            case "coverLetter":
                return "My Cover Letter"
            default:
                return "Document"
            }
        }
        
        private func isFirstOfType(_ type: String) -> Bool {
            !parent.dataManager.documents.contains(where: { $0.type == type })
        }
    }
}

// MARK: - Document Preview

struct DocumentPreviewView: UIViewControllerRepresentable {
    let url: URL
    
    func makeUIViewController(context: Context) -> UIViewController {
        let controller = UIViewController()
        
        // Create document interaction controller
        let interaction = UIDocumentInteractionController(url: url)
        interaction.delegate = context.coordinator
        
        // Present preview
        DispatchQueue.main.async {
            interaction.presentPreview(animated: true)
        }
        
        return controller
    }
    
    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIDocumentInteractionControllerDelegate {
        let parent: DocumentPreviewView
        
        init(_ parent: DocumentPreviewView) {
            self.parent = parent
        }
        
        func documentInteractionControllerViewControllerForPreview(_ controller: UIDocumentInteractionController) -> UIViewController {
            let scenes = UIApplication.shared.connectedScenes
            let windowScene = scenes.first as? UIWindowScene
            return windowScene?.windows.first?.rootViewController ?? UIViewController()
        }
    }
}

// MARK: - Preview

struct DocumentsView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            DocumentsView()
        }
    }
} 