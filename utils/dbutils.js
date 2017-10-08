module.exports = {
  // Query DB with designated sql & values
  queryDb: (sql, values, pool) => {
    return new Promise((onSuccess, onError) => {
      pool.getConnection(function(err, connection) {
        connection.query({
          sql: sql,
          values: values
        }, function (err, rows, fields) {
          if (err) {
            onError(err);             // reject the promise
            return;
          }

          connection.release();
          onSuccess(rows, fields);    // fulfill the promise by manipulating the db rows data
        });
      });
    });
  },
}