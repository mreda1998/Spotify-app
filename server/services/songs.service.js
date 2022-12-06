const { FileSystemManager } = require("./file_system_manager");
const { dbService } = require("./database.service");
const DB_CONSTS = require("../utils/env");

const path = require("path");

class SongService {
  constructor () {
    this.JSON_PATH = path.join(__dirname + "../../data/songs.json");
    this.fileSystemManager = new FileSystemManager();
    this.dbService = dbService;
  }

  get collection () {
    return this.dbService.db.collection(DB_CONSTS.DB_COLLECTION_SONGS);
  }

  /**
   *
   *
   * Retourne la liste de toutes les chansons
   * @returns {Promise<Array>}
   */
  async getAllSongs () {
    await this.populateDb();
    return await this.collection.find({}).toArray();
  }

  /**
   *
   *
   * Retourne une chanson en fonction de son id
   * @param {number} id identifiant de la chanson
   * @returns chanson correspondant à l'id
   */
  async getSongById (id) {
    await this.populateDb();
    return await this.collection.findOne({ id });
  }

  /**
   *
   *
   * Modifie l'état aimé d'une chanson par l'état inverse
   * @param {number} id identifiant de la chanson
   * @returns {boolean} le nouveau état aimé de la chanson
   */
  async updateSongLike (id) {
    const idInt = parseInt(id);
    const songToUpdate = await this.getSongById(idInt);
    const newLikedStatus = !((await this.getSongById(idInt)).liked);
    songToUpdate.liked = newLikedStatus;
    const setQuery = { $set: { liked: newLikedStatus } };
    await this.collection.updateOne({ id: idInt }, setQuery);
    return newLikedStatus;
  }

  /**
   *
   *
   * Cherche et retourne les chansons qui ont un mot clé spécifique dans leur description (name, artist, genre)
   * Si le paramètre 'exact' est TRUE, la recherche est sensible à la case
   * en utilisant l'option "i" dans la recherche par expression régulière
   * @param {string} substring mot clé à chercher
   * @param {boolean} exact si la recherche est sensible à la case
   * @returns toutes les chansons qui ont le mot clé cherché dans leur contenu (name, artist, genre)
   */
  async search (substring, exact) {
    let results = [];
    if (exact) {
      const filterName = { name: { $regex: `${substring}` } };
      const filterArtist = { artist: { $regex: `${substring}` } };
      const filterGenre = { genre: { $regex: `${substring}` } };
      results = await this.collection.find({ $or: [filterName, filterArtist, filterGenre] }).toArray();
    } else {
      const filterName = { name: { $regex: `${substring}`, $options: "i" } };
      const filterArtist = { artist: { $regex: `${substring}`, $options: "i" } };
      const filterGenre = { genre: { $regex: `${substring}`, $options: "i" } };
      results = await this.collection.find({ $or: [filterName, filterArtist, filterGenre] }).toArray();
    }

    return results;
  }

  async populateDb () {
    const songs = JSON.parse(await this.fileSystemManager.readFile(this.JSON_PATH)).songs;
    await this.dbService.populateDb(DB_CONSTS.DB_COLLECTION_SONGS, songs);
  }
}

module.exports = { SongService };
