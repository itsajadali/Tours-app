class APIfeatures {
  // queryStr is (req.query)
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  filter() {
    const queryObj = { ...this.queryStr }; // deconstructing
    const excludesFields = ["page", "sort", "limits", "fields"]; // fields we want to (ignore them) and we want to query the later

    // 2) removing the fields from queryObj
    excludesFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj); // {"difficulty":"easy","duration":{"eq":"5"}}

    queryStr = queryStr.replace(
      /\b(gte|gt|eq|lt|lte)\b/g,
      (match) => `$${match}`,
    );
    // note that if there is no match will simply ignore it

    this.query = this.query.find(JSON.parse(queryStr));

    return this; // ! returning the entire object after calling this method

    // let query = Tour.find(JSON.parse(queryStr));
  }

  sort() {
    if (this.queryStr.sort) {
      this.query = this.query.sort(this.queryStr.sort);
    } else {
      this.query = this.query.sort("-maxGroupSize");
    }
    return this;
  }

  limitsField() {
    // ! by fields limiting
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(",").join(" ");
      this.query = this.query.select(fields); // query.select(name duration ....)
    } else {
      this.query = this.query.select("-__v"); // hide - means select all except this
    }
    return this;
  }

  paginate() {
    const page = this.queryStr.page * 1 || 1; // if there is non set it to 1
    const limits = this.queryStr.limits * 1 || 10; // if there is not set it to 10
    const skip = (page - 1) * limits;

    this.query = this.query.skip(skip).limit(limits); // 1-10 page 1 , 11-20 page 2 etc ...

    return this;
  }
}

module.exports = APIfeatures;
