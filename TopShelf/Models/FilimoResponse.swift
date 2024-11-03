//
//  FilimoResponse.swift
//  Filimo
//
//  Created by Saeed Taheri on 11/3/24.
//  Copyright © 2024 Filimo. All rights reserved.
//

// Root structure for the Filimo API response
struct FilimoResponse: Codable {
  let data: [FilimoData]
  let included: [FilimoMovieDetail]
}

// Structure representing each item in "data" array
struct FilimoData: Codable {
  let attributes: FilimoAttributes
  let relationships: FilimoRelationships
}

// Attributes for Filimo tags to check for theme == "thumbnail"
struct FilimoAttributes: Codable {
  let theme: String
}

// Relationships to access "movies" and other related data
struct FilimoRelationships: Codable {
  let movies: FilimoMovies
}

// Movies structure to handle an array of movie references
struct FilimoMovies: Codable {
  let data: [FilimoMovieReference]
}

// Reference to a movie ID in "relationships.movies"
struct FilimoMovieReference: Codable {
  enum CodingKeys: String, CodingKey {
    case id
  }

  let id: String

  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)

    // Attempt to decode `id` as a String first, and if it fails, try as an Int
    if let stringID = try? container.decode(String.self, forKey: .id) {
      self.id = stringID
    } else if let intID = try? container.decode(Int.self, forKey: .id) {
      self.id = String(intID)
    } else {
      throw DecodingError.typeMismatch(
        String.self,
        DecodingError.Context(
          codingPath: decoder.codingPath,
          debugDescription: "Expected id to be either String or Int"
        )
      )
    }
  }
}

// FilimoMovieDetail for items in "included" array, containing movie attributes
struct FilimoMovieDetail: Codable {
  enum CodingKeys: String, CodingKey {
    case id
    case attributes
  }

  let id: String
  let attributes: Movie

  // Custom initializer to decode `id` as either String or Int
  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)

    // Attempt to decode `id` as a String first, and if it fails, try as an Int
    if let stringID = try? container.decode(String.self, forKey: .id) {
      self.id = stringID
    } else if let intID = try? container.decode(Int.self, forKey: .id) {
      self.id = String(intID)
    } else {
      throw DecodingError.typeMismatch(String.self, DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "Expected id to be either String or Int"))
    }

    self.attributes = try container.decode(Movie.self, forKey: .attributes)
  }
}

// Movie structure for detailed movie information
struct Movie: Codable {
  let uuid: String
  let title: String?
  let titleEn: String?
  let desc: String?
  let cover: String?
  let coverData: CoverData?
  let thumbplay: ThumbPlay?
  let duration: Int?
  let categories: [Category]?
  let picture: Picture?
  let isHD: Bool

  enum CodingKeys: String, CodingKey {
    case uuid = "uid"
    case title = "movie_title"
    case titleEn = "movie_title_en"
    case desc = "descr"
    case cover
    case coverData = "cover_data"
    case thumbplay
    case duration
    case categories
    case picture = "pic"
    case isHD = "HD"
  }

  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)

    if let coverString = try? container.decode(String.self, forKey: .cover) {
      cover = coverString
    } else if let coverArray = try? container.decode([String].self, forKey: .cover) {
      cover = coverArray.first
    } else {
      cover = nil
    }

    if let durationModel = try? container.decode(Duration.self, forKey: .duration) {
      duration = durationModel.value
    } else if let durationInt = try? container.decode(Int.self, forKey: .duration) {
      duration = durationInt
    } else {
      duration = nil
    }

    // Decode all other properties normally
    uuid = try container.decodeIfPresent(String.self, forKey: .uuid) ?? ""
    title = try container.decodeIfPresent(String.self, forKey: .title)
    titleEn = try container.decodeIfPresent(String.self, forKey: .titleEn)
    desc = try container.decodeIfPresent(String.self, forKey: .desc)
    coverData = try container.decodeIfPresent(CoverData.self, forKey: .coverData)
    thumbplay = try container.decodeIfPresent(ThumbPlay.self, forKey: .thumbplay)
    categories = try container.decodeIfPresent([Category].self, forKey: .categories)
    picture = try container.decodeIfPresent(Picture.self, forKey: .picture)
    isHD = try container.decodeIfPresent(Bool.self, forKey: .isHD) ?? false
  }
}

// Duration structure for movie duration information
struct Duration: Codable {
  let value: Int
  let text: String
}

// Category structure for movie categories
struct Category: Codable {
  let title: String
  let titleEn: String

  enum CodingKeys: String, CodingKey {
    case title
    case titleEn = "title_en"
  }
}

// Picture structure for different image sizes
struct Picture: Codable {
  let small: String
  let medium: String
  let large: String

  enum CodingKeys: String, CodingKey {
    case small = "movie_img_s"
    case medium = "movie_img_m"
    case large = "movie_img_b"
  }
}

// Thumbplay structure for different thumbnail sizes
struct ThumbPlay: Codable {
  let small: String
  let medium: String
  let large: String

  enum CodingKeys: String, CodingKey {
    case small = "thumbplay_img_s"
    case medium = "thumbplay_img_m"
    case large = "thumbplay_img_b"
  }
}

// CoverData structure for different cover orientations
struct CoverData: Codable {
  let horizontal: String
  let vertical: String
}
