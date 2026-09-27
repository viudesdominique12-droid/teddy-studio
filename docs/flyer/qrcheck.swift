import Foundation
import Vision
import AppKit
for path in CommandLine.arguments.dropFirst() {
    guard let img = NSImage(contentsOfFile: path), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { print(path, "→ image illisible"); continue }
    let req = VNDetectBarcodesRequest()
    req.symbologies = [.qr]
    try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
    let found = (req.results ?? []).compactMap { $0.payloadStringValue }
    print((path as NSString).lastPathComponent, "→", found.isEmpty ? "AUCUN QR LU" : found.joined(separator: " | "))
}
