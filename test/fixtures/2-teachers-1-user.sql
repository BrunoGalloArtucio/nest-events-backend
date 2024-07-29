INSERT INTO
    `user` (
        `id`,
        `username`,
        `password`,
        `email`,
        `firstName`,
        `lastName`,
        `profileId`
    )
VALUES
    (
        NULL,
        'e2e-test',
        '$2b$10$5v5ZIVbPGXf0126yUiiys.z/POxSaus.iSbzXj7cTRW9KWGy5bfcq',
        'e2e@test.com',
        'End',
        'To End',
        NULL
    );

INSERT INTO
    `teacher` (
        `id`,
        `name`,
        `age`,
        `gender`
    )
VALUES
    (
        NULL,
        'Teacher 1',
        36,
        'Male'
    );

INSERT INTO
    `teacher` (
        `id`,
        `name`,
        `age`,
        `gender`
    )
VALUES
    (
        NULL,
        'Teacher 2',
        40,
        'Female'
    )