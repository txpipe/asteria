using Asteria.Indexer.Data;
using Asteria.Indexer.Reduers;
using Cardano.Sync;
using Cardano.Sync.Reducers;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSingleton<IReducer, UtxoCborByAddressReducer>();

builder.Services.AddCardanoIndexer<AsteriaDbContext>(builder.Configuration, 60);

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

using var scope = app.Services.CreateScope();
var dbContext = scope.ServiceProvider.GetRequiredService<AsteriaDbContext>();
dbContext.Database.Migrate();

app.Run();