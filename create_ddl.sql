begin;

create schema if not exists cats;

create table if not exists cats.cats(
  cat_id int not null auto_increment,
  birthday date,
  breed varchar(255),
  imageUrl varchar(1024),
  name varchar(1024) not null,
  password varchar(1024) not null,
  username varchar(255) not null unique,
  weight float not null,
  lastSeenAt datetime default CURRENT_TIMESTAMP,
  primary key(cat_id)
);

insert into cats.cats(birthday, breed, imageUrl, name, password, username, weight, lastSeenAt)
  values ( '2013-12-31', 'German Shepard', 'http://ibm.com', 'Jeff', 'ppp', 'jpercent', 100, CURRENT_TIMESTAMP);

insert into cats.cats(birthday, breed, imageUrl, name, password, username, weight)
  values ( '2013-12-31', 'German Shepard', 'http://ibm.com', 'Jeff', 'ppp', 'percent', 100);

commit;
